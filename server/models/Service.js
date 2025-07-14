const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'cleaning',
      'pet-care',
      'beauty-personal-care',
      'gardening',
      'automotive'
    ]
  },
  subcategory: {
    type: String,
    required: true,
    enum: [
      // Cleaning
      'house-cleaning',
      'deep-cleaning',
      'office-cleaning',
      
      // Pet Care
      'pet-sitting',
      'dog-walking',
      'pet-grooming',
      
      // Beauty & Personal Care
      'hairdressing',
      'massage-therapy',
      'makeup-artist',
      'nail-technician',
      
      // Gardening
      'lawn-mowing',
      'garden-maintenance',
      'landscaping',
      
      // Automotive
      'car-wash-interior',
      'car-wash-exterior',
      'car-wash-full-sedan',
      'car-wash-full-suv'
    ]
  },
  icon: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  
  // Pricing
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  pricingType: {
    type: String,
    enum: ['hourly', 'fixed', 'per-item'],
    required: true
  },
  currency: {
    type: String,
    default: 'ZAR'
  },
  
  // Duration
  estimatedDuration: {
    min: { type: Number, required: true }, // in minutes
    max: { type: Number, required: true }
  },
  
  // Requirements
  requiresEquipment: {
    type: Boolean,
    default: false
  },
  equipmentList: [String],
  
  // Special requirements
  requiresWater: {
    type: Boolean,
    default: false
  },
  requiresElectricity: {
    type: Boolean,
    default: false
  },
  requiresParking: {
    type: Boolean,
    default: false
  },
  
  // Service area
  availableProvinces: [{
    type: String,
    enum: [
      'Eastern Cape',
      'Free State',
      'Gauteng',
      'KwaZulu-Natal',
      'Limpopo',
      'Mpumalanga',
      'Northern Cape',
      'North West',
      'Western Cape'
    ]
  }],
  
  // Business rules
  minimumAdvanceBooking: {
    type: Number, // in hours
    default: 2
  },
  maximumAdvanceBooking: {
    type: Number, // in days
    default: 30
  },
  cancellationPolicy: {
    type: String,
    enum: ['flexible', 'moderate', 'strict'],
    default: 'moderate'
  },
  
  // Service specifications
  specifications: [{
    name: String,
    value: String,
    required: Boolean
  }],
  
  // Add-ons
  addOns: [{
    name: String,
    description: String,
    price: Number,
    duration: Number // additional minutes
  }],
  
  // Certification requirements
  requiredCertifications: [String],
  
  // Activity status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // SEO and content
  tags: [String],
  seoTitle: String,
  seoDescription: String,
  
  // Analytics
  totalBookings: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0
  },
  
  // Admin fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
serviceSchema.index({ category: 1, subcategory: 1 });
serviceSchema.index({ name: 'text', description: 'text', tags: 'text' });
serviceSchema.index({ isActive: 1 });
serviceSchema.index({ availableProvinces: 1 });

// Virtual for formatted price
serviceSchema.virtual('formattedPrice').get(function() {
  return `R${this.basePrice.toFixed(2)}`;
});

// Virtual for full name (category + name)
serviceSchema.virtual('fullName').get(function() {
  return `${this.category} - ${this.name}`;
});

serviceSchema.set('toJSON', { virtuals: true });
serviceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Service', serviceSchema);