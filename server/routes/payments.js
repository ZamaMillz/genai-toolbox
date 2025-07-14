const express = require('express');
const Stripe = require('stripe');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key');

// Create payment intent for booking
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }
    
    const booking = await Booking.findById(bookingId)
      .populate('customer')
      .populate('provider')
      .populate('service');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Verify user owns this booking
    if (booking.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (booking.payment.status !== 'pending') {
      return res.status(400).json({ message: 'Payment already processed or failed' });
    }
    
    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.pricing.total * 100), // Convert to cents
      currency: 'zar',
      metadata: {
        bookingId: booking._id.toString(),
        customerId: booking.customer._id.toString(),
        providerId: booking.provider._id.toString(),
        serviceName: booking.service.name
      },
      description: `HelperHive: ${booking.service.name} service`
    });
    
    // Update booking with payment intent ID
    booking.payment.stripePaymentIntentId = paymentIntent.id;
    booking.payment.status = 'processing';
    await booking.save();
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: booking.pricing.total
    });
    
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ message: 'Failed to create payment intent', error: error.message });
  }
});

// Confirm payment
router.post('/confirm-payment', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({ message: 'Payment intent ID is required' });
    }
    
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        message: 'Payment not completed', 
        status: paymentIntent.status 
      });
    }
    
    // Find booking by payment intent ID
    const booking = await Booking.findOne({
      'payment.stripePaymentIntentId': paymentIntentId
    });
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Verify user owns this booking
    if (booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update booking payment status
    booking.payment.status = 'completed';
    booking.payment.paidAt = new Date();
    booking.payment.transactionId = paymentIntent.id;
    booking.payment.platformFeeCollected = true;
    
    // Update provider payout status
    booking.payment.providerPayoutStatus = 'scheduled';
    
    await booking.save();
    
    // Update user spending
    await User.findByIdAndUpdate(booking.customer, {
      $inc: { 'customerProfile.totalSpent': booking.pricing.total }
    });
    
    // Emit real-time notification
    req.io.emit(`provider_${booking.provider}`, {
      type: 'payment_confirmed',
      bookingId: booking._id,
      amount: booking.pricing.subtotal
    });
    
    res.json({
      message: 'Payment confirmed successfully',
      booking: {
        id: booking._id,
        status: booking.status,
        paymentStatus: booking.payment.status,
        amount: booking.pricing.total
      }
    });
    
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Failed to confirm payment', error: error.message });
  }
});

// Get payment history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    let query = {};
    if (req.user.userType === 'customer') {
      query.customer = req.user._id;
    } else if (req.user.userType === 'provider') {
      query.provider = req.user._id;
    }
    
    if (status) {
      query['payment.status'] = status;
    }
    
    const payments = await Booking.find(query)
      .select('bookingNumber pricing payment scheduledDate status')
      .populate('service', 'name icon')
      .populate(req.user.userType === 'customer' ? 'provider' : 'customer', 'firstName lastName')
      .sort({ 'payment.paidAt': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Booking.countDocuments(query);
    
    res.json({
      payments,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPayments: total
    });
    
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ message: 'Failed to get payment history', error: error.message });
  }
});

// Request refund
router.post('/request-refund', authenticateToken, async (req, res) => {
  try {
    const { bookingId, reason } = req.body;
    
    if (!bookingId || !reason) {
      return res.status(400).json({ message: 'Booking ID and reason are required' });
    }
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Verify user owns this booking
    if (booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (booking.payment.status !== 'completed') {
      return res.status(400).json({ message: 'Payment not completed, cannot request refund' });
    }
    
    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Cannot refund completed service' });
    }
    
    // Calculate refund amount based on timing and cancellation policy
    let refundAmount = 0;
    const timeUntilService = new Date(booking.scheduledDate) - new Date();
    const hoursUntilService = timeUntilService / (1000 * 60 * 60);
    
    if (hoursUntilService > 24) {
      refundAmount = booking.pricing.total * 0.9; // 90% refund (10% processing fee)
    } else if (hoursUntilService > 2) {
      refundAmount = booking.pricing.total * 0.5; // 50% refund
    }
    
    if (refundAmount > 0) {
      // Create refund in Stripe
      const refund = await stripe.refunds.create({
        payment_intent: booking.payment.stripePaymentIntentId,
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason: 'requested_by_customer',
        metadata: {
          bookingId: booking._id.toString(),
          refundReason: reason
        }
      });
      
      // Update booking
      booking.payment.status = 'refunded';
      booking.status = 'cancelled';
      booking.cancellation = {
        cancelledBy: req.user._id,
        reason,
        timestamp: new Date(),
        refundAmount,
        refundStatus: 'completed'
      };
      
      await booking.save();
      
      res.json({
        message: 'Refund processed successfully',
        refundAmount,
        refundId: refund.id
      });
    } else {
      res.json({
        message: 'No refund available due to timing policy',
        refundAmount: 0
      });
    }
    
  } catch (error) {
    console.error('Request refund error:', error);
    res.status(500).json({ message: 'Failed to process refund', error: error.message });
  }
});

// Provider earnings dashboard
router.get('/provider/earnings', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'provider') {
      return res.status(403).json({ message: 'Provider access required' });
    }
    
    const { period = 'month' } = req.query; // week, month, year
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'week':
        dateFilter = { $gte: new Date(now.setDate(now.getDate() - 7)) };
        break;
      case 'month':
        dateFilter = { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
        break;
      case 'year':
        dateFilter = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
        break;
    }
    
    // Get earnings data
    const earningsData = await Booking.aggregate([
      {
        $match: {
          provider: req.user._id,
          status: 'completed',
          'payment.status': 'completed',
          'payment.paidAt': dateFilter
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$pricing.subtotal' },
          totalBookings: { $sum: 1 },
          averageBookingValue: { $avg: '$pricing.subtotal' }
        }
      }
    ]);
    
    // Get pending payouts
    const pendingPayouts = await Booking.find({
      provider: req.user._id,
      status: 'completed',
      'payment.status': 'completed',
      'payment.providerPayoutStatus': { $in: ['pending', 'scheduled'] }
    }).select('pricing.subtotal payment.paidAt');
    
    const pendingAmount = pendingPayouts.reduce((sum, booking) => sum + booking.pricing.subtotal, 0);
    
    // Get daily earnings for chart
    const dailyEarnings = await Booking.aggregate([
      {
        $match: {
          provider: req.user._id,
          status: 'completed',
          'payment.status': 'completed',
          'payment.paidAt': { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$payment.paidAt' }
          },
          earnings: { $sum: '$pricing.subtotal' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    const earnings = earningsData.length > 0 ? earningsData[0] : {
      totalEarnings: 0,
      totalBookings: 0,
      averageBookingValue: 0
    };
    
    res.json({
      period,
      earnings: {
        total: Math.round(earnings.totalEarnings * 100) / 100,
        pending: Math.round(pendingAmount * 100) / 100,
        bookingsCount: earnings.totalBookings,
        averageValue: Math.round(earnings.averageBookingValue * 100) / 100
      },
      dailyEarnings,
      pendingPayouts: pendingPayouts.length
    });
    
  } catch (error) {
    console.error('Get provider earnings error:', error);
    res.status(500).json({ message: 'Failed to get earnings data', error: error.message });
  }
});

// Mock webhook for Stripe events (in production, this would be properly secured)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        
        // Update booking status
        await Booking.findOneAndUpdate(
          { 'payment.stripePaymentIntentId': paymentIntent.id },
          { 
            'payment.status': 'completed',
            'payment.paidAt': new Date()
          }
        );
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('Payment failed:', failedPayment.id);
        
        // Update booking status
        await Booking.findOneAndUpdate(
          { 'payment.stripePaymentIntentId': failedPayment.id },
          { 'payment.status': 'failed' }
        );
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;