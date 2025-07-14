const express = require('express');
const multer = require('multer');
const Joi = require('joi');
const User = require('../models/User');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const { 
  authenticateToken, 
  requireProvider, 
  requireCustomer 
} = require('../middleware/auth');

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const allowedFields = [
      'firstName', 'lastName', 'dateOfBirth', 'gender', 
      'address', 'emergencyContacts', 'privacySettings'
    ];
    
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({
      message: 'Profile updated successfully',
      user
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

// Upload profile picture
router.post('/profile/picture', authenticateToken, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: `/uploads/${req.file.filename}` },
      { new: true }
    ).select('-password');
    
    res.json({
      message: 'Profile picture updated successfully',
      profilePicture: user.profilePicture
    });
    
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({ message: 'Failed to upload profile picture', error: error.message });
  }
});

// Update user location
router.put('/location', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        }
      },
      { new: true }
    ).select('-password');
    
    res.json({
      message: 'Location updated successfully',
      location: user.location
    });
    
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Failed to update location', error: error.message });
  }
});

// Provider-specific routes

// Update provider profile
router.put('/provider/profile', authenticateToken, requireProvider, async (req, res) => {
  try {
    const allowedFields = [
      'bio', 'hourlyRate', 'availability', 'experience', 
      'hasOwnEquipment', 'servingRadius'
    ];
    
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[`providerProfile.${field}`] = req.body[field];
      }
    });
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password').populate('providerProfile.services');
    
    res.json({
      message: 'Provider profile updated successfully',
      user
    });
    
  } catch (error) {
    console.error('Update provider profile error:', error);
    res.status(500).json({ message: 'Failed to update provider profile', error: error.message });
  }
});

// Add/remove services for provider
router.post('/provider/services', authenticateToken, requireProvider, async (req, res) => {
  try {
    const { serviceIds } = req.body;
    
    if (!Array.isArray(serviceIds)) {
      return res.status(400).json({ message: 'Service IDs must be an array' });
    }
    
    // Verify all service IDs exist
    const services = await Service.find({ _id: { $in: serviceIds }, isActive: true });
    if (services.length !== serviceIds.length) {
      return res.status(400).json({ message: 'One or more invalid service IDs' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 'providerProfile.services': serviceIds },
      { new: true }
    ).select('-password').populate('providerProfile.services');
    
    res.json({
      message: 'Services updated successfully',
      services: user.providerProfile.services
    });
    
  } catch (error) {
    console.error('Update provider services error:', error);
    res.status(500).json({ message: 'Failed to update services', error: error.message });
  }
});

// Upload provider documents
router.post('/provider/documents', authenticateToken, requireProvider, upload.fields([
  { name: 'idDocument', maxCount: 1 },
  { name: 'proofOfAddress', maxCount: 1 },
  { name: 'certifications', maxCount: 5 }
]), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (req.files.idDocument) {
      user.providerProfile.documents.idDocument = {
        url: `/uploads/${req.files.idDocument[0].filename}`,
        uploadedAt: new Date()
      };
    }
    
    if (req.files.proofOfAddress) {
      user.providerProfile.documents.proofOfAddress = {
        url: `/uploads/${req.files.proofOfAddress[0].filename}`,
        uploadedAt: new Date()
      };
    }
    
    if (req.files.certifications) {
      const certifications = req.files.certifications.map(file => ({
        name: req.body.certificationName || 'Certification',
        url: `/uploads/${file.filename}`,
        uploadedAt: new Date()
      }));
      user.providerProfile.documents.certifications.push(...certifications);
    }
    
    await user.save();
    
    res.json({
      message: 'Documents uploaded successfully',
      documents: user.providerProfile.documents
    });
    
  } catch (error) {
    console.error('Upload documents error:', error);
    res.status(500).json({ message: 'Failed to upload documents', error: error.message });
  }
});

// Update provider availability status
router.patch('/provider/availability', authenticateToken, requireProvider, async (req, res) => {
  try {
    const { isAvailable, isOnline } = req.body;
    
    const updateData = {};
    if (typeof isAvailable === 'boolean') {
      updateData['providerProfile.isAvailable'] = isAvailable;
    }
    if (typeof isOnline === 'boolean') {
      updateData['providerProfile.isOnline'] = isOnline;
      updateData['providerProfile.lastActive'] = new Date();
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select('-password');
    
    res.json({
      message: 'Availability updated successfully',
      availability: {
        isAvailable: user.providerProfile.isAvailable,
        isOnline: user.providerProfile.isOnline
      }
    });
    
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ message: 'Failed to update availability', error: error.message });
  }
});

// Add bank details for provider
router.put('/provider/bank-details', authenticateToken, requireProvider, async (req, res) => {
  try {
    const { accountHolder, bankName, accountNumber, branchCode } = req.body;
    
    if (!accountHolder || !bankName || !accountNumber || !branchCode) {
      return res.status(400).json({ message: 'All bank details are required' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        'providerProfile.bankDetails': {
          accountHolder,
          bankName,
          accountNumber,
          branchCode,
          verified: false
        }
      },
      { new: true }
    ).select('-password');
    
    res.json({
      message: 'Bank details updated successfully',
      bankDetails: user.providerProfile.bankDetails
    });
    
  } catch (error) {
    console.error('Update bank details error:', error);
    res.status(500).json({ message: 'Failed to update bank details', error: error.message });
  }
});

// Get provider dashboard data
router.get('/provider/dashboard', authenticateToken, requireProvider, async (req, res) => {
  try {
    // Get booking statistics
    const totalBookings = await Booking.countDocuments({ provider: req.user._id });
    const completedBookings = await Booking.countDocuments({ 
      provider: req.user._id, 
      status: 'completed' 
    });
    const pendingBookings = await Booking.countDocuments({ 
      provider: req.user._id, 
      status: 'pending' 
    });
    
    // Get earnings (assuming completed bookings have been paid)
    const earningsResult = await Booking.aggregate([
      { $match: { provider: req.user._id, status: 'completed' } },
      { $group: { _id: null, totalEarnings: { $sum: '$pricing.subtotal' } } }
    ]);
    
    const totalEarnings = earningsResult.length > 0 ? earningsResult[0].totalEarnings : 0;
    
    // Get recent bookings
    const recentBookings = await Booking.find({ provider: req.user._id })
      .populate('customer', 'firstName lastName profilePicture')
      .populate('service', 'name icon')
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json({
      stats: {
        totalBookings,
        completedBookings,
        pendingBookings,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        completionRate: totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0
      },
      recentBookings
    });
    
  } catch (error) {
    console.error('Get provider dashboard error:', error);
    res.status(500).json({ message: 'Failed to get dashboard data', error: error.message });
  }
});

// Customer-specific routes

// Add preferred provider
router.post('/customer/preferred-providers', authenticateToken, requireCustomer, async (req, res) => {
  try {
    const { providerId } = req.body;
    
    if (!providerId) {
      return res.status(400).json({ message: 'Provider ID is required' });
    }
    
    const provider = await User.findById(providerId);
    if (!provider || provider.userType !== 'provider') {
      return res.status(404).json({ message: 'Provider not found' });
    }
    
    const user = await User.findById(req.user._id);
    if (!user.customerProfile.preferredProviders.includes(providerId)) {
      user.customerProfile.preferredProviders.push(providerId);
      await user.save();
    }
    
    res.json({
      message: 'Provider added to preferences',
      preferredProviders: user.customerProfile.preferredProviders
    });
    
  } catch (error) {
    console.error('Add preferred provider error:', error);
    res.status(500).json({ message: 'Failed to add preferred provider', error: error.message });
  }
});

// Remove preferred provider
router.delete('/customer/preferred-providers/:providerId', authenticateToken, requireCustomer, async (req, res) => {
  try {
    const { providerId } = req.params;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { 'customerProfile.preferredProviders': providerId } },
      { new: true }
    );
    
    res.json({
      message: 'Provider removed from preferences',
      preferredProviders: user.customerProfile.preferredProviders
    });
    
  } catch (error) {
    console.error('Remove preferred provider error:', error);
    res.status(500).json({ message: 'Failed to remove preferred provider', error: error.message });
  }
});

// Get customer dashboard data
router.get('/customer/dashboard', authenticateToken, requireCustomer, async (req, res) => {
  try {
    // Get booking statistics
    const totalBookings = await Booking.countDocuments({ customer: req.user._id });
    const completedBookings = await Booking.countDocuments({ 
      customer: req.user._id, 
      status: 'completed' 
    });
    const upcomingBookings = await Booking.countDocuments({ 
      customer: req.user._id, 
      status: { $in: ['pending', 'confirmed', 'en-route'] },
      scheduledDate: { $gte: new Date() }
    });
    
    // Get total spent
    const spentResult = await Booking.aggregate([
      { $match: { customer: req.user._id, status: 'completed' } },
      { $group: { _id: null, totalSpent: { $sum: '$pricing.total' } } }
    ]);
    
    const totalSpent = spentResult.length > 0 ? spentResult[0].totalSpent : 0;
    
    // Get recent bookings
    const recentBookings = await Booking.find({ customer: req.user._id })
      .populate('provider', 'firstName lastName profilePicture')
      .populate('service', 'name icon')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get preferred providers
    const preferredProviders = await User.find({
      _id: { $in: req.user.customerProfile.preferredProviders }
    }).select('firstName lastName profilePicture providerProfile.rating');
    
    res.json({
      stats: {
        totalBookings,
        completedBookings,
        upcomingBookings,
        totalSpent: Math.round(totalSpent * 100) / 100
      },
      recentBookings,
      preferredProviders
    });
    
  } catch (error) {
    console.error('Get customer dashboard error:', error);
    res.status(500).json({ message: 'Failed to get dashboard data', error: error.message });
  }
});

// Search providers
router.get('/providers/search', async (req, res) => {
  try {
    const { 
      service, 
      latitude, 
      longitude, 
      radius = 25, 
      minRating = 0,
      hasOwnEquipment,
      page = 1, 
      limit = 20 
    } = req.query;
    
    let query = {
      userType: 'provider',
      'providerProfile.isAvailable': true,
      'providerProfile.backgroundCheckStatus': 'approved',
      isActive: true,
      isSuspended: false
    };
    
    // Filter by service
    if (service) {
      query['providerProfile.services'] = service;
    }
    
    // Filter by rating
    if (minRating > 0) {
      query['providerProfile.rating.average'] = { $gte: minRating };
    }
    
    // Filter by equipment
    if (hasOwnEquipment !== undefined) {
      query['providerProfile.hasOwnEquipment'] = hasOwnEquipment === 'true';
    }
    
    // Location-based search
    if (latitude && longitude) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      };
    }
    
    const providers = await User.find(query)
      .select('firstName lastName profilePicture providerProfile location')
      .populate('providerProfile.services', 'name icon')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await User.countDocuments(query);
    
    res.json({
      providers,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProviders: total
    });
    
  } catch (error) {
    console.error('Search providers error:', error);
    res.status(500).json({ message: 'Failed to search providers', error: error.message });
  }
});

// Get provider details
router.get('/providers/:id', async (req, res) => {
  try {
    const provider = await User.findById(req.params.id)
      .select('-password -emailVerificationToken -phoneVerificationCode -resetPasswordToken')
      .populate('providerProfile.services');
    
    if (!provider || provider.userType !== 'provider') {
      return res.status(404).json({ message: 'Provider not found' });
    }
    
    // Get recent reviews from completed bookings
    const reviews = await Booking.find({
      provider: req.params.id,
      status: 'completed',
      'review.customerReview.rating': { $exists: true }
    })
    .select('review.customerReview customer createdAt')
    .populate('customer', 'firstName lastName profilePicture')
    .sort({ createdAt: -1 })
    .limit(10);
    
    res.json({
      provider,
      reviews
    });
    
  } catch (error) {
    console.error('Get provider details error:', error);
    res.status(500).json({ message: 'Failed to get provider details', error: error.message });
  }
});

module.exports = router;