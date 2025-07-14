const express = require('express');
const Service = require('../models/Service');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all active services
router.get('/', async (req, res) => {
  try {
    const { category, province, search, page = 1, limit = 20 } = req.query;
    
    let query = { isActive: true };
    
    // Filter by category
    if (category) {
      query.category = category;
    }
    
    // Filter by province
    if (province) {
      query.availableProvinces = province;
    }
    
    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }
    
    const services = await Service.find(query)
      .sort({ totalBookings: -1, averageRating: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Service.countDocuments(query);
    
    res.json({
      services,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalServices: total
    });
    
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ message: 'Failed to get services', error: error.message });
  }
});

// Get service by ID with available providers
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service || !service.isActive) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Get available providers for this service
    const providers = await User.find({
      userType: 'provider',
      'providerProfile.services': req.params.id,
      'providerProfile.isAvailable': true,
      'providerProfile.backgroundCheckStatus': 'approved',
      isActive: true,
      isSuspended: false
    })
    .select('firstName lastName profilePicture providerProfile.rating providerProfile.hasOwnEquipment providerProfile.hourlyRate providerProfile.isOnline location')
    .limit(20);
    
    res.json({
      service,
      availableProviders: providers.length,
      providers
    });
    
  } catch (error) {
    console.error('Get service by ID error:', error);
    res.status(500).json({ message: 'Failed to get service', error: error.message });
  }
});

// Get services by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { province, page = 1, limit = 20 } = req.query;
    
    let query = { 
      category: category,
      isActive: true 
    };
    
    if (province) {
      query.availableProvinces = province;
    }
    
    const services = await Service.find(query)
      .sort({ totalBookings: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Service.countDocuments(query);
    
    res.json({
      category,
      services,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalServices: total
    });
    
  } catch (error) {
    console.error('Get services by category error:', error);
    res.status(500).json({ message: 'Failed to get services by category', error: error.message });
  }
});

// Get all service categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Service.aggregate([
      { $match: { isActive: true } },
      { 
        $group: { 
          _id: '$category',
          count: { $sum: 1 },
          services: { 
            $push: {
              _id: '$_id',
              name: '$name',
              subcategory: '$subcategory',
              basePrice: '$basePrice',
              icon: '$icon'
            }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    res.json({ categories });
    
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Failed to get categories', error: error.message });
  }
});

// Find providers near location
router.post('/providers/nearby', async (req, res) => {
  try {
    const { serviceId, latitude, longitude, radius = 25 } = req.body;
    
    if (!serviceId || !latitude || !longitude) {
      return res.status(400).json({ 
        message: 'Service ID, latitude, and longitude are required' 
      });
    }
    
    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    const providers = await User.find({
      userType: 'provider',
      'providerProfile.services': serviceId,
      'providerProfile.isAvailable': true,
      'providerProfile.backgroundCheckStatus': 'approved',
      isActive: true,
      isSuspended: false,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    })
    .select('firstName lastName profilePicture providerProfile location')
    .limit(20);
    
    // Calculate distance for each provider
    const providersWithDistance = providers.map(provider => {
      const distance = calculateDistance(
        latitude, longitude,
        provider.location.coordinates[1], provider.location.coordinates[0]
      );
      
      return {
        ...provider.toObject(),
        distance: Math.round(distance * 10) / 10 // Round to 1 decimal place
      };
    });
    
    res.json({
      service: service.name,
      location: { latitude, longitude },
      radius,
      providers: providersWithDistance,
      totalFound: providersWithDistance.length
    });
    
  } catch (error) {
    console.error('Find nearby providers error:', error);
    res.status(500).json({ message: 'Failed to find nearby providers', error: error.message });
  }
});

// Admin routes - Create new service
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const serviceData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    const service = new Service(serviceData);
    await service.save();
    
    res.status(201).json({
      message: 'Service created successfully',
      service
    });
    
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ message: 'Failed to create service', error: error.message });
  }
});

// Admin routes - Update service
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      lastUpdatedBy: req.user._id
    };
    
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.json({
      message: 'Service updated successfully',
      service
    });
    
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ message: 'Failed to update service', error: error.message });
  }
});

// Admin routes - Delete service (soft delete)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { 
        isActive: false,
        lastUpdatedBy: req.user._id
      },
      { new: true }
    );
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.json({
      message: 'Service deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ message: 'Failed to delete service', error: error.message });
  }
});

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

module.exports = router;