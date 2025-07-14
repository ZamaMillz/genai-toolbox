const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Info
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  // User Type
  userType: {
    type: String,
    enum: ['customer', 'provider'],
    required: true
  },
  
  // Profile
  profilePicture: {
    type: String,
    default: null
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say']
  },
  
  // Address
  address: {
    street: String,
    city: String,
    province: String,
    postalCode: String,
    country: {
      type: String,
      default: 'South Africa'
    }
  },
  
  // Location
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  
  // Verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  phoneVerificationCode: String,
  phoneVerificationExpires: Date,
  
  // Provider-specific fields
  providerProfile: {
    bio: String,
    services: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service'
    }],
    hourlyRate: {
      type: Number,
      min: 0
    },
    availability: {
      monday: { start: String, end: String, available: Boolean },
      tuesday: { start: String, end: String, available: Boolean },
      wednesday: { start: String, end: String, available: Boolean },
      thursday: { start: String, end: String, available: Boolean },
      friday: { start: String, end: String, available: Boolean },
      saturday: { start: String, end: String, available: Boolean },
      sunday: { start: String, end: String, available: Boolean }
    },
    experience: {
      type: String,
      enum: ['beginner', 'intermediate', 'expert']
    },
    hasOwnEquipment: {
      type: Boolean,
      default: false
    },
    servingRadius: {
      type: Number, // in kilometers
      default: 25
    },
    
    // Verification documents
    documents: {
      idDocument: {
        url: String,
        verified: { type: Boolean, default: false },
        uploadedAt: Date
      },
      proofOfAddress: {
        url: String,
        verified: { type: Boolean, default: false },
        uploadedAt: Date
      },
      certifications: [{
        name: String,
        url: String,
        verified: { type: Boolean, default: false },
        uploadedAt: Date
      }]
    },
    
    // Background check
    backgroundCheckStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'not-required'],
      default: 'pending'
    },
    
    // Financial
    bankDetails: {
      accountHolder: String,
      bankName: String,
      accountNumber: String,
      branchCode: String,
      verified: { type: Boolean, default: false }
    },
    
    // Performance
    totalEarnings: {
      type: Number,
      default: 0
    },
    completedJobs: {
      type: Number,
      default: 0
    },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 }
    },
    
    // Status
    isOnline: {
      type: Boolean,
      default: false
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    lastActive: Date
  },
  
  // Customer-specific fields
  customerProfile: {
    preferredProviders: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    totalBookings: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    }
  },
  
  // Emergency contacts
  emergencyContacts: [{
    name: String,
    phone: String,
    relationship: String
  }],
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  suspensionReason: String,
  
  // Reset password
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // FCM Token for push notifications
  fcmToken: String,
  
  // Privacy settings
  privacySettings: {
    shareLocation: { type: Boolean, default: true },
    showPhone: { type: Boolean, default: false },
    allowMarketing: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ location: '2dsphere' });
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ userType: 1 });
userSchema.index({ 'providerProfile.services': 1 });
userSchema.index({ 'providerProfile.isOnline': 1 });

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Get provider rating
userSchema.virtual('providerRating').get(function() {
  if (this.userType === 'provider' && this.providerProfile.rating.count > 0) {
    return (this.providerProfile.rating.average / this.providerProfile.rating.count).toFixed(1);
  }
  return 0;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);