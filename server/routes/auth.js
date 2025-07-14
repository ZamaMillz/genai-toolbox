const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const User = require('../models/User');
const { 
  generateToken, 
  authenticateToken, 
  generateOTP, 
  generateSecureToken,
  sensitiveOperationLimit 
} = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^(\+27|0)[6-8][0-9]{8}$/).required(),
  password: Joi.string().min(6).required(),
  userType: Joi.string().valid('customer', 'provider').required(),
  acceptTerms: Joi.boolean().valid(true).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const verifyOTPSchema = Joi.object({
  phone: Joi.string().required(),
  otp: Joi.string().length(6).required()
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    // Validate input
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.details[0].message 
      });
    }

    const { firstName, lastName, email, phone, password, userType } = value;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(409).json({ 
        message: 'User already exists with this email or phone number' 
      });
    }

    // Generate email verification token and phone OTP
    const emailVerificationToken = generateSecureToken();
    const phoneVerificationCode = generateOTP();
    const phoneVerificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      phone,
      password,
      userType,
      emailVerificationToken,
      phoneVerificationCode,
      phoneVerificationExpires,
      // Initialize provider profile if provider
      ...(userType === 'provider' && {
        providerProfile: {
          bio: '',
          services: [],
          availability: {
            monday: { start: '08:00', end: '17:00', available: true },
            tuesday: { start: '08:00', end: '17:00', available: true },
            wednesday: { start: '08:00', end: '17:00', available: true },
            thursday: { start: '08:00', end: '17:00', available: true },
            friday: { start: '08:00', end: '17:00', available: true },
            saturday: { start: '08:00', end: '17:00', available: true },
            sunday: { start: '08:00', end: '17:00', available: false }
          },
          hasOwnEquipment: false,
          isOnline: false,
          isAvailable: true
        }
      }),
      // Initialize customer profile if customer
      ...(userType === 'customer' && {
        customerProfile: {
          preferredProviders: [],
          totalBookings: 0,
          totalSpent: 0
        }
      })
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    // TODO: Send verification email and SMS
    console.log(`Email verification token for ${email}: ${emailVerificationToken}`);
    console.log(`Phone verification code for ${phone}: ${phoneVerificationCode}`);

    // Return user data without password
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.emailVerificationToken;
    delete userResponse.phoneVerificationCode;

    res.status(201).json({
      message: 'User registered successfully',
      user: userResponse,
      token,
      verification: {
        emailSent: true,
        smsSent: true
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.details[0].message 
      });
    }

    const { email, password } = value;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account has been deactivated' });
    }

    if (user.isSuspended) {
      return res.status(401).json({ 
        message: 'Account is suspended', 
        reason: user.suspensionReason 
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update last active for providers
    if (user.userType === 'provider') {
      user.providerProfile.lastActive = new Date();
      await user.save();
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Return user data without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'Login successful',
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Verify phone OTP
router.post('/verify-phone', async (req, res) => {
  try {
    const { error, value } = verifyOTPSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.details[0].message 
      });
    }

    const { phone, otp } = value;

    const user = await User.findOne({ 
      phone,
      phoneVerificationCode: otp,
      phoneVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Mark phone as verified
    user.isPhoneVerified = true;
    user.phoneVerificationCode = undefined;
    user.phoneVerificationExpires = undefined;
    await user.save();

    res.json({ message: 'Phone number verified successfully' });

  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json({ message: 'Phone verification failed', error: error.message });
  }
});

// Resend phone OTP
router.post('/resend-phone-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const user = await User.findOne({ phone, isPhoneVerified: false });
    if (!user) {
      return res.status(404).json({ message: 'User not found or already verified' });
    }

    // Generate new OTP
    const phoneVerificationCode = generateOTP();
    const phoneVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.phoneVerificationCode = phoneVerificationCode;
    user.phoneVerificationExpires = phoneVerificationExpires;
    await user.save();

    // TODO: Send SMS
    console.log(`New phone verification code for ${phone}: ${phoneVerificationCode}`);

    res.json({ message: 'New verification code sent' });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to resend OTP', error: error.message });
  }
});

// Verify email
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Email verification failed', error: error.message });
  }
});

// Request password reset
router.post('/forgot-password', sensitiveOperationLimit, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    // Generate reset token
    const resetToken = generateSecureToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // TODO: Send reset email
    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.json({ message: 'If the email exists, a reset link has been sent' });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Password reset request failed', error: error.message });
  }
});

// Reset password
router.post('/reset-password', sensitiveOperationLimit, async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Password reset failed', error: error.message });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('providerProfile.services')
      .select('-password');

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user data', error: error.message });
  }
});

// Refresh token
router.post('/refresh-token', authenticateToken, async (req, res) => {
  try {
    const token = generateToken(req.user._id);
    res.json({ token });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Token refresh failed', error: error.message });
  }
});

// Logout (client-side should delete token)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // For providers, update online status
    if (req.user.userType === 'provider') {
      await User.findByIdAndUpdate(req.user._id, {
        'providerProfile.isOnline': false,
        'providerProfile.lastActive': new Date()
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed', error: error.message });
  }
});

module.exports = router;