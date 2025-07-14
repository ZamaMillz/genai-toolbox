const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'helperhive-secret-key', {
    expiresIn: '7d'
  });
};

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'helperhive-secret-key');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account has been deactivated' });
    }

    if (user.isSuspended) {
      return res.status(401).json({ 
        message: 'Account is suspended', 
        reason: user.suspensionReason 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};

// Check if user is a customer
const requireCustomer = (req, res, next) => {
  if (req.user.userType !== 'customer') {
    return res.status(403).json({ message: 'Customer access required' });
  }
  next();
};

// Check if user is a service provider
const requireProvider = (req, res, next) => {
  if (req.user.userType !== 'provider') {
    return res.status(403).json({ message: 'Service provider access required' });
  }
  next();
};

// Check if user is admin (for now, we'll use a special email pattern)
const requireAdmin = (req, res, next) => {
  if (!req.user.email.includes('@helperhive.admin') && !req.user.email.includes('@admin.helperhive')) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Check if user is verified (email and phone)
const requireVerified = (req, res, next) => {
  if (!req.user.isEmailVerified || !req.user.isPhoneVerified) {
    return res.status(403).json({ 
      message: 'Account verification required',
      verification: {
        email: req.user.isEmailVerified,
        phone: req.user.isPhoneVerified
      }
    });
  }
  next();
};

// Check if provider is approved
const requireApprovedProvider = (req, res, next) => {
  if (req.user.userType !== 'provider') {
    return res.status(403).json({ message: 'Service provider access required' });
  }
  
  if (req.user.providerProfile.backgroundCheckStatus !== 'approved') {
    return res.status(403).json({ 
      message: 'Provider approval required',
      status: req.user.providerProfile.backgroundCheckStatus
    });
  }
  next();
};

// Rate limiting for sensitive operations
const sensitiveOperationLimit = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for sensitive operations
  message: 'Too many sensitive operations attempted, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Generate OTP (6-digit number)
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate secure random token
const generateSecureToken = () => {
  return require('crypto').randomBytes(32).toString('hex');
};

module.exports = {
  generateToken,
  authenticateToken,
  requireCustomer,
  requireProvider,
  requireAdmin,
  requireVerified,
  requireApprovedProvider,
  sensitiveOperationLimit,
  generateOTP,
  generateSecureToken
};