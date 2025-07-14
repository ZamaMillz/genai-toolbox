const express = require('express');
const Joi = require('joi');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const User = require('../models/User');
const { 
  authenticateToken, 
  requireCustomer, 
  requireProvider, 
  requireVerified 
} = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createBookingSchema = Joi.object({
  providerId: Joi.string().required(),
  serviceId: Joi.string().required(),
  scheduledDate: Joi.date().min('now').required(),
  scheduledTime: Joi.object({
    start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
  }).required(),
  serviceLocation: Joi.object({
    address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      province: Joi.string().required(),
      postalCode: Joi.string(),
      country: Joi.string().default('South Africa')
    }).required(),
    coordinates: Joi.array().items(Joi.number()).length(2).required(),
    specialInstructions: Joi.string().allow(''),
    accessInstructions: Joi.string().allow('')
  }).required(),
  serviceDetails: Joi.object({
    requirements: Joi.object({
      customerProvidesEquipment: Joi.boolean().default(false),
      waterAvailable: Joi.boolean().default(true),
      electricityAvailable: Joi.boolean().default(true),
      parkingAvailable: Joi.boolean().default(true)
    }),
    specialRequests: Joi.string().allow(''),
    addOns: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      price: Joi.number().min(0).required()
    })).default([])
  }).default({})
});

// Create new booking
router.post('/', authenticateToken, requireCustomer, requireVerified, async (req, res) => {
  try {
    // Validate input
    const { error, value } = createBookingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.details[0].message 
      });
    }

    const { providerId, serviceId, scheduledDate, scheduledTime, serviceLocation, serviceDetails } = value;

    // Verify service exists and is active
    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({ message: 'Service not found or not available' });
    }

    // Verify provider exists and is available
    const provider = await User.findById(providerId);
    if (!provider || provider.userType !== 'provider' || !provider.isActive) {
      return res.status(404).json({ message: 'Provider not found or not available' });
    }

    if (provider.providerProfile.backgroundCheckStatus !== 'approved') {
      return res.status(400).json({ message: 'Provider is not approved yet' });
    }

    if (!provider.providerProfile.isAvailable) {
      return res.status(400).json({ message: 'Provider is not currently available' });
    }

    // Check if provider offers this service
    if (!provider.providerProfile.services.includes(serviceId)) {
      return res.status(400).json({ message: 'Provider does not offer this service' });
    }

    // Calculate pricing
    const addOnsTotal = serviceDetails.addOns?.reduce((sum, addon) => sum + addon.price, 0) || 0;
    const subtotal = service.basePrice + addOnsTotal;
    const platformFee = Math.round(subtotal * 0.1 * 100) / 100; // 10% platform fee
    const total = subtotal + platformFee;

    // Create booking
    const booking = new Booking({
      customer: req.user._id,
      provider: providerId,
      service: serviceId,
      scheduledDate,
      scheduledTime,
      serviceLocation,
      serviceDetails: {
        duration: service.estimatedDuration.min,
        ...serviceDetails
      },
      pricing: {
        basePrice: service.basePrice,
        addOnsTotal,
        subtotal,
        platformFee,
        total
      },
      metadata: {
        source: 'web',
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    await booking.save();

    // Populate the booking for response
    await booking.populate([
      { path: 'customer', select: 'firstName lastName email phone' },
      { path: 'provider', select: 'firstName lastName email phone profilePicture' },
      { path: 'service', select: 'name category icon' }
    ]);

    // Emit real-time notification to provider
    req.io.emit(`provider_${providerId}`, {
      type: 'new_booking',
      booking: booking
    });

    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Failed to create booking', error: error.message });
  }
});

// Get user's bookings
router.get('/my-bookings', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (req.user.userType === 'customer') {
      query.customer = req.user._id;
    } else if (req.user.userType === 'provider') {
      query.provider = req.user._id;
    }
    
    if (status) {
      query.status = status;
    }
    
    const bookings = await Booking.find(query)
      .populate('customer', 'firstName lastName profilePicture')
      .populate('provider', 'firstName lastName profilePicture')
      .populate('service', 'name category icon')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Booking.countDocuments(query);
    
    res.json({
      bookings,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalBookings: total
    });
    
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Failed to get bookings', error: error.message });
  }
});

// Get booking by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'firstName lastName profilePicture phone emergencyContacts')
      .populate('provider', 'firstName lastName profilePicture phone providerProfile.rating')
      .populate('service');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user has access to this booking
    if (booking.customer._id.toString() !== req.user._id.toString() && 
        booking.provider._id.toString() !== req.user._id.toString() && 
        !req.user.email.includes('@admin.helperhive')) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json({ booking });
    
  } catch (error) {
    console.error('Get booking by ID error:', error);
    res.status(500).json({ message: 'Failed to get booking', error: error.message });
  }
});

// Provider accepts/rejects booking
router.patch('/:id/respond', authenticateToken, requireProvider, async (req, res) => {
  try {
    const { action, reason } = req.body; // action: 'accept' or 'reject'
    
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be accept or reject' });
    }
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Booking is no longer pending' });
    }
    
    if (action === 'accept') {
      booking.status = 'confirmed';
    } else {
      booking.status = 'cancelled';
      booking.cancellation = {
        cancelledBy: req.user._id,
        reason: reason || 'Provider declined',
        timestamp: new Date()
      };
    }
    
    await booking.save();
    
    // Emit real-time notification to customer
    req.io.emit(`customer_${booking.customer}`, {
      type: 'booking_response',
      bookingId: booking._id,
      status: booking.status,
      action
    });
    
    res.json({
      message: `Booking ${action}ed successfully`,
      booking
    });
    
  } catch (error) {
    console.error('Booking response error:', error);
    res.status(500).json({ message: 'Failed to respond to booking', error: error.message });
  }
});

// Update booking status (for providers)
router.patch('/:id/status', authenticateToken, requireProvider, async (req, res) => {
  try {
    const { status, location } = req.body;
    
    const validStatuses = ['en-route', 'in-progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update status
    booking.status = status;
    
    // Update tracking information
    if (status === 'en-route' && location) {
      booking.providerTracking.currentLocation = [location.longitude, location.latitude];
      booking.providerTracking.estimatedArrival = location.estimatedArrival;
    } else if (status === 'in-progress') {
      booking.providerTracking.actualArrival = new Date();
    } else if (status === 'completed') {
      booking.providerTracking.actualCompletion = new Date();
    }
    
    await booking.save();
    
    // Emit real-time notification to customer
    req.io.to(`booking_${booking._id}`).emit('booking_status_changed', {
      bookingId: booking._id,
      status,
      location: location ? booking.providerTracking.currentLocation : null,
      timestamp: new Date()
    });
    
    res.json({
      message: 'Booking status updated successfully',
      booking
    });
    
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Failed to update booking status', error: error.message });
  }
});

// Update provider location during booking
router.patch('/:id/location', authenticateToken, requireProvider, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (!['confirmed', 'en-route', 'in-progress'].includes(booking.status)) {
      return res.status(400).json({ message: 'Location tracking not active for this booking status' });
    }
    
    // Update provider location
    booking.providerTracking.currentLocation = [longitude, latitude];
    await booking.save();
    
    // Emit real-time location update to customer
    req.io.to(`booking_${booking._id}`).emit('provider_location', {
      bookingId: booking._id,
      location: [longitude, latitude],
      timestamp: new Date()
    });
    
    res.json({
      message: 'Location updated successfully'
    });
    
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Failed to update location', error: error.message });
  }
});

// Emergency alert
router.post('/:id/emergency', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user is involved in this booking
    if (booking.customer.toString() !== req.user._id.toString() && 
        booking.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Set emergency alert
    booking.emergencyAlert = {
      isActive: true,
      triggeredBy: req.user._id,
      timestamp: new Date(),
      reason: reason || 'Emergency situation reported'
    };
    
    await booking.save();
    
    // Emit emergency broadcast
    req.io.emit('emergency_broadcast', {
      bookingId: booking._id,
      location: booking.serviceLocation.coordinates,
      triggeredBy: req.user.userType,
      reason,
      timestamp: new Date()
    });
    
    res.json({
      message: 'Emergency alert sent successfully'
    });
    
  } catch (error) {
    console.error('Emergency alert error:', error);
    res.status(500).json({ message: 'Failed to send emergency alert', error: error.message });
  }
});

// Add message to booking
router.post('/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user is involved in this booking
    if (booking.customer.toString() !== req.user._id.toString() && 
        booking.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Add message
    const newMessage = {
      sender: req.user._id,
      message: message.trim(),
      timestamp: new Date()
    };
    
    booking.messages.push(newMessage);
    await booking.save();
    
    // Emit real-time message
    req.io.to(`booking_${booking._id}`).emit('new_message', {
      bookingId: booking._id,
      message: newMessage,
      senderName: req.user.firstName
    });
    
    res.json({
      message: 'Message sent successfully',
      messageData: newMessage
    });
    
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
});

// Cancel booking
router.patch('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user is involved in this booking
    if (booking.customer.toString() !== req.user._id.toString() && 
        booking.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ message: 'Booking cannot be cancelled at this stage' });
    }
    
    // Calculate refund based on cancellation time
    const timeUntilService = new Date(booking.scheduledDate) - new Date();
    const hoursUntilService = timeUntilService / (1000 * 60 * 60);
    
    let refundStatus = 'none';
    let refundAmount = 0;
    
    if (hoursUntilService > 24) {
      refundStatus = 'full';
      refundAmount = booking.pricing.total;
    } else if (hoursUntilService > 2) {
      refundStatus = 'partial';
      refundAmount = booking.pricing.total * 0.5;
    }
    
    booking.status = 'cancelled';
    booking.cancellation = {
      cancelledBy: req.user._id,
      reason: reason || 'Cancelled by user',
      timestamp: new Date(),
      refundAmount,
      refundStatus
    };
    
    await booking.save();
    
    // Emit cancellation notification
    const otherParty = booking.customer.toString() === req.user._id.toString() 
      ? booking.provider 
      : booking.customer;
    
    req.io.emit(`user_${otherParty}`, {
      type: 'booking_cancelled',
      bookingId: booking._id,
      cancelledBy: req.user.userType
    });
    
    res.json({
      message: 'Booking cancelled successfully',
      refund: {
        status: refundStatus,
        amount: refundAmount
      }
    });
    
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Failed to cancel booking', error: error.message });
  }
});

module.exports = router;