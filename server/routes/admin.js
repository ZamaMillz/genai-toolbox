const express = require('express');
const User = require('../models/User');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken, requireAdmin);

// Dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    // Get platform statistics
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ userType: 'customer' });
    const totalProviders = await User.countDocuments({ userType: 'provider' });
    const activeProviders = await User.countDocuments({ 
      userType: 'provider', 
      'providerProfile.isOnline': true 
    });
    
    const totalBookings = await Booking.countDocuments();
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    
    // Revenue calculations
    const revenueData = await Booking.aggregate([
      { $match: { status: 'completed', 'payment.status': 'completed' } },
      { 
        $group: { 
          _id: null, 
          totalRevenue: { $sum: '$pricing.total' },
          platformFees: { $sum: '$pricing.platformFee' }
        } 
      }
    ]);
    
    const revenue = revenueData.length > 0 ? revenueData[0] : { totalRevenue: 0, platformFees: 0 };
    
    // Recent activity
    const recentUsers = await User.find()
      .select('firstName lastName email userType createdAt')
      .sort({ createdAt: -1 })
      .limit(5);
    
    const recentBookings = await Booking.find()
      .populate('customer', 'firstName lastName')
      .populate('provider', 'firstName lastName')
      .populate('service', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Monthly growth data (last 12 months)
    const monthlyData = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          bookings: { $sum: 1 },
          revenue: { $sum: '$pricing.total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    res.json({
      stats: {
        users: {
          total: totalUsers,
          customers: totalCustomers,
          providers: totalProviders,
          activeProviders
        },
        bookings: {
          total: totalBookings,
          completed: completedBookings,
          pending: pendingBookings,
          completionRate: totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0
        },
        revenue: {
          total: Math.round(revenue.totalRevenue * 100) / 100,
          platformFees: Math.round(revenue.platformFees * 100) / 100
        }
      },
      recentActivity: {
        users: recentUsers,
        bookings: recentBookings
      },
      monthlyData
    });
    
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Failed to get dashboard data', error: error.message });
  }
});

// User management
router.get('/users', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      userType, 
      status, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    let query = {};
    
    if (userType) {
      query.userType = userType;
    }
    
    if (status === 'active') {
      query.isActive = true;
      query.isSuspended = false;
    } else if (status === 'suspended') {
      query.isSuspended = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const users = await User.find(query)
      .select('-password -emailVerificationToken -phoneVerificationCode -resetPasswordToken')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total
    });
    
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to get users', error: error.message });
  }
});

// Get user details
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -emailVerificationToken -phoneVerificationCode -resetPasswordToken')
      .populate('providerProfile.services');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user's booking history
    const bookings = await Booking.find({
      $or: [
        { customer: req.params.id },
        { provider: req.params.id }
      ]
    })
    .populate('customer', 'firstName lastName')
    .populate('provider', 'firstName lastName')
    .populate('service', 'name')
    .sort({ createdAt: -1 })
    .limit(10);
    
    res.json({
      user,
      bookings
    });
    
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ message: 'Failed to get user details', error: error.message });
  }
});

// Update user status
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { isActive, isSuspended, suspensionReason } = req.body;
    
    const updateData = {};
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }
    if (typeof isSuspended === 'boolean') {
      updateData.isSuspended = isSuspended;
      if (isSuspended && suspensionReason) {
        updateData.suspensionReason = suspensionReason;
      } else if (!isSuspended) {
        updateData.suspensionReason = undefined;
      }
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'User status updated successfully',
      user
    });
    
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Failed to update user status', error: error.message });
  }
});

// Provider verification management
router.get('/providers/pending-verification', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const providers = await User.find({
      userType: 'provider',
      'providerProfile.backgroundCheckStatus': 'pending'
    })
    .select('firstName lastName email phone providerProfile createdAt')
    .populate('providerProfile.services')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();
    
    const total = await User.countDocuments({
      userType: 'provider',
      'providerProfile.backgroundCheckStatus': 'pending'
    });
    
    res.json({
      providers,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProviders: total
    });
    
  } catch (error) {
    console.error('Get pending providers error:', error);
    res.status(500).json({ message: 'Failed to get pending providers', error: error.message });
  }
});

// Approve/reject provider
router.patch('/providers/:id/verification', async (req, res) => {
  try {
    const { status, reason } = req.body; // status: 'approved' or 'rejected'
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be approved or rejected' });
    }
    
    const user = await User.findById(req.params.id);
    if (!user || user.userType !== 'provider') {
      return res.status(404).json({ message: 'Provider not found' });
    }
    
    user.providerProfile.backgroundCheckStatus = status;
    
    if (status === 'rejected') {
      user.isSuspended = true;
      user.suspensionReason = reason || 'Verification rejected';
    }
    
    await user.save();
    
    // TODO: Send notification email to provider
    
    res.json({
      message: `Provider ${status} successfully`,
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        status: user.providerProfile.backgroundCheckStatus
      }
    });
    
  } catch (error) {
    console.error('Provider verification error:', error);
    res.status(500).json({ message: 'Failed to update provider verification', error: error.message });
  }
});

// Verify provider documents
router.patch('/providers/:id/documents/:documentType/verify', async (req, res) => {
  try {
    const { id, documentType } = req.params;
    const { verified, reason } = req.body;
    
    const validDocTypes = ['idDocument', 'proofOfAddress'];
    if (!validDocTypes.includes(documentType)) {
      return res.status(400).json({ message: 'Invalid document type' });
    }
    
    const user = await User.findById(id);
    if (!user || user.userType !== 'provider') {
      return res.status(404).json({ message: 'Provider not found' });
    }
    
    if (!user.providerProfile.documents[documentType]) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    user.providerProfile.documents[documentType].verified = verified;
    if (!verified && reason) {
      user.providerProfile.documents[documentType].rejectionReason = reason;
    }
    
    await user.save();
    
    res.json({
      message: `Document ${verified ? 'verified' : 'rejected'} successfully`
    });
    
  } catch (error) {
    console.error('Document verification error:', error);
    res.status(500).json({ message: 'Failed to verify document', error: error.message });
  }
});

// Booking management
router.get('/bookings', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      dateFrom, 
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (dateFrom || dateTo) {
      query.scheduledDate = {};
      if (dateFrom) query.scheduledDate.$gte = new Date(dateFrom);
      if (dateTo) query.scheduledDate.$lte = new Date(dateTo);
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const bookings = await Booking.find(query)
      .populate('customer', 'firstName lastName email')
      .populate('provider', 'firstName lastName email')
      .populate('service', 'name category')
      .sort(sortOptions)
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

// Get booking details
router.get('/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer')
      .populate('provider')
      .populate('service');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json({ booking });
    
  } catch (error) {
    console.error('Get booking details error:', error);
    res.status(500).json({ message: 'Failed to get booking details', error: error.message });
  }
});

// Handle disputes
router.get('/disputes', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const disputes = await Booking.find({
      $or: [
        { status: 'disputed' },
        { 'emergencyAlert.isActive': true }
      ]
    })
    .populate('customer', 'firstName lastName email phone')
    .populate('provider', 'firstName lastName email phone')
    .populate('service', 'name')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();
    
    const total = await Booking.countDocuments({
      $or: [
        { status: 'disputed' },
        { 'emergencyAlert.isActive': true }
      ]
    });
    
    res.json({
      disputes,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalDisputes: total
    });
    
  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({ message: 'Failed to get disputes', error: error.message });
  }
});

// Resolve dispute
router.patch('/disputes/:id/resolve', async (req, res) => {
  try {
    const { resolution, refundAmount } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Update booking status based on resolution
    if (resolution === 'refund_customer') {
      booking.status = 'cancelled';
      booking.payment.status = 'refunded';
      booking.cancellation = {
        cancelledBy: req.user._id,
        reason: 'Admin resolution - customer refund',
        timestamp: new Date(),
        refundAmount: refundAmount || booking.pricing.total,
        refundStatus: 'completed'
      };
    } else if (resolution === 'favor_provider') {
      booking.status = 'completed';
    }
    
    // Resolve emergency alert if active
    if (booking.emergencyAlert.isActive) {
      booking.emergencyAlert.resolved = true;
    }
    
    await booking.save();
    
    res.json({
      message: 'Dispute resolved successfully',
      booking
    });
    
  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({ message: 'Failed to resolve dispute', error: error.message });
  }
});

// Financial reports
router.get('/reports/financial', async (req, res) => {
  try {
    const { period = 'month', year, month } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    if (period === 'month' && year && month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      dateFilter = { $gte: startDate, $lte: endDate };
    } else if (period === 'year' && year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      dateFilter = { $gte: startDate, $lte: endDate };
    } else {
      // Default to current month
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      dateFilter = { $gte: startDate, $lte: endDate };
    }
    
    const financialData = await Booking.aggregate([
      {
        $match: {
          status: 'completed',
          'payment.status': 'completed',
          'payment.paidAt': dateFilter
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.total' },
          totalPlatformFees: { $sum: '$pricing.platformFee' },
          totalProviderPayouts: { $sum: '$pricing.subtotal' },
          totalBookings: { $sum: 1 },
          averageBookingValue: { $avg: '$pricing.total' }
        }
      }
    ]);
    
    const categoryBreakdown = await Booking.aggregate([
      {
        $match: {
          status: 'completed',
          'payment.status': 'completed',
          'payment.paidAt': dateFilter
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: 'service',
          foreignField: '_id',
          as: 'serviceDetails'
        }
      },
      {
        $group: {
          _id: '$serviceDetails.category',
          revenue: { $sum: '$pricing.total' },
          bookings: { $sum: 1 }
        }
      }
    ]);
    
    const data = financialData.length > 0 ? financialData[0] : {
      totalRevenue: 0,
      totalPlatformFees: 0,
      totalProviderPayouts: 0,
      totalBookings: 0,
      averageBookingValue: 0
    };
    
    res.json({
      period,
      summary: {
        totalRevenue: Math.round(data.totalRevenue * 100) / 100,
        platformFees: Math.round(data.totalPlatformFees * 100) / 100,
        providerPayouts: Math.round(data.totalProviderPayouts * 100) / 100,
        totalBookings: data.totalBookings,
        averageBookingValue: Math.round(data.averageBookingValue * 100) / 100
      },
      categoryBreakdown
    });
    
  } catch (error) {
    console.error('Financial reports error:', error);
    res.status(500).json({ message: 'Failed to get financial reports', error: error.message });
  }
});

// System settings (mock implementation)
router.get('/settings', async (req, res) => {
  try {
    const settings = {
      platformFeePercentage: 10,
      minimumBookingAmount: 50,
      maxAdvanceBookingDays: 30,
      cancellationPolicies: {
        flexible: { fullRefundHours: 24, partialRefundHours: 2 },
        moderate: { fullRefundHours: 48, partialRefundHours: 24 },
        strict: { fullRefundHours: 72, partialRefundHours: 48 }
      },
      payoutSchedule: 'weekly', // weekly, bi-weekly, monthly
      maintenanceMode: false
    };
    
    res.json({ settings });
    
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Failed to get settings', error: error.message });
  }
});

// Update system settings
router.put('/settings', async (req, res) => {
  try {
    // In a real implementation, these would be stored in a database
    const allowedSettings = [
      'platformFeePercentage',
      'minimumBookingAmount',
      'maxAdvanceBookingDays',
      'payoutSchedule',
      'maintenanceMode'
    ];
    
    const updatedSettings = {};
    allowedSettings.forEach(setting => {
      if (req.body[setting] !== undefined) {
        updatedSettings[setting] = req.body[setting];
      }
    });
    
    // TODO: Save to database
    console.log('Settings updated:', updatedSettings);
    
    res.json({
      message: 'Settings updated successfully',
      settings: updatedSettings
    });
    
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Failed to update settings', error: error.message });
  }
});

module.exports = router;