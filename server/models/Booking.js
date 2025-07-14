const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // References
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  
  // Booking identification
  bookingNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  // Scheduling
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    start: { type: String, required: true }, // HH:MM format
    end: String // estimated end time
  },
  
  // Location
  serviceLocation: {
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      province: { type: String, required: true },
      postalCode: String,
      country: { type: String, default: 'South Africa' }
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    specialInstructions: String,
    accessInstructions: String
  },
  
  // Service details
  serviceDetails: {
    duration: Number, // estimated duration in minutes
    requirements: {
      customerProvidesEquipment: { type: Boolean, default: false },
      waterAvailable: { type: Boolean, default: true },
      electricityAvailable: { type: Boolean, default: true },
      parkingAvailable: { type: Boolean, default: true }
    },
    specialRequests: String,
    addOns: [{
      name: String,
      price: Number
    }]
  },
  
  // Pricing
  pricing: {
    basePrice: { type: Number, required: true },
    addOnsTotal: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
    platformFee: { type: Number, required: true }, // 10%
    total: { type: Number, required: true },
    currency: { type: String, default: 'ZAR' }
  },
  
  // Status tracking
  status: {
    type: String,
    enum: [
      'pending',        // Waiting for provider confirmation
      'confirmed',      // Provider confirmed
      'en-route',       // Provider traveling to location
      'in-progress',    // Service being performed
      'completed',      // Service completed
      'cancelled',      // Cancelled by customer or provider
      'no-show',        // Provider didn't show up
      'disputed'        // Dispute raised
    ],
    default: 'pending'
  },
  
  // Timestamps for status changes
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Provider tracking
  providerTracking: {
    currentLocation: {
      type: [Number], // [longitude, latitude]
      default: null
    },
    estimatedArrival: Date,
    actualArrival: Date,
    actualCompletion: Date
  },
  
  // Communication
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    messageType: {
      type: String,
      enum: ['text', 'image', 'system'],
      default: 'text'
    },
    isRead: { type: Boolean, default: false }
  }],
  
  // Emergency
  emergencyAlert: {
    isActive: { type: Boolean, default: false },
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: Date,
    reason: String,
    resolved: { type: Boolean, default: false }
  },
  
  // Payment
  payment: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['card', 'bank-transfer', 'cash'],
      default: 'card'
    },
    stripePaymentIntentId: String,
    transactionId: String,
    paidAt: Date,
    providerPayoutStatus: {
      type: String,
      enum: ['pending', 'scheduled', 'completed'],
      default: 'pending'
    },
    providerPayoutDate: Date,
    platformFeeCollected: { type: Boolean, default: false }
  },
  
  // Reviews and ratings
  review: {
    customerReview: {
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      submittedAt: Date
    },
    providerReview: {
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      submittedAt: Date
    }
  },
  
  // Cancellation
  cancellation: {
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    timestamp: Date,
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ['none', 'partial', 'full', 'processing', 'completed']
    }
  },
  
  // Rescheduling
  rescheduleHistory: [{
    oldDate: Date,
    oldTime: String,
    newDate: Date,
    newTime: String,
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Quality assurance
  qualityCheck: {
    beforePhotos: [String],
    afterPhotos: [String],
    checklistCompleted: { type: Boolean, default: false },
    customerSatisfaction: {
      type: String,
      enum: ['very-satisfied', 'satisfied', 'neutral', 'dissatisfied', 'very-dissatisfied']
    }
  },
  
  // Additional metadata
  metadata: {
    source: { type: String, default: 'web' }, // web, mobile, admin
    userAgent: String,
    ipAddress: String,
    referrer: String
  }
}, {
  timestamps: true
});

// Indexes
bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ provider: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ scheduledDate: 1 });
bookingSchema.index({ bookingNumber: 1 });
bookingSchema.index({ 'serviceLocation.coordinates': '2dsphere' });

// Generate booking number before saving
bookingSchema.pre('save', function(next) {
  if (!this.bookingNumber) {
    // Generate format: HH-YYYYMMDD-XXXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    this.bookingNumber = `HH-${dateStr}-${randomNum}`;
  }
  next();
});

// Update status history when status changes
bookingSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    });
  }
  next();
});

// Virtual for booking duration in hours
bookingSchema.virtual('durationHours').get(function() {
  if (this.serviceDetails.duration) {
    return (this.serviceDetails.duration / 60).toFixed(1);
  }
  return 0;
});

// Virtual for formatted total price
bookingSchema.virtual('formattedTotal').get(function() {
  return `R${this.pricing.total.toFixed(2)}`;
});

// Virtual for time until service
bookingSchema.virtual('timeUntilService').get(function() {
  const now = new Date();
  const serviceDateTime = new Date(this.scheduledDate);
  const [hours, minutes] = this.scheduledTime.start.split(':');
  serviceDateTime.setHours(parseInt(hours), parseInt(minutes));
  
  return serviceDateTime - now;
});

bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Booking', bookingSchema);