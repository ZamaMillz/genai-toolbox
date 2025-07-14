# HelperHive 🏠

**HelperHive** is a comprehensive home services platform similar to Bolt, Uber, and InDrive, specifically designed for South African markets. The app connects customers with verified service providers for cleaning, gardening, and car washing services.

## 🌟 Features

### For Customers
- **Service Booking**: Book cleaning, gardening, and car wash services
- **Real-time Tracking**: Track your service provider's location and progress
- **Secure Payments**: Pay safely using Stripe with South African Rand (ZAR)
- **Service Customization**: Choose specific services and equipment requirements
- **Emergency Contacts**: Built-in safety features for peace of mind
- **Rating System**: Rate and review service providers

### For Service Providers
- **Document Verification**: Upload and verify identity documents
- **Earnings Dashboard**: Track weekly earnings and payment history
- **Job Management**: Accept/decline job requests with detailed information
- **Availability Control**: Turn availability on/off as needed
- **Weekly Payouts**: Receive payments weekly (90% of service fee)

### Security Features (Similar to Bolt/Uber/InDrive)
- ✅ **Two-Factor Authentication**: OTP verification for login
- ✅ **Background Checks**: Verified service providers with police clearance
- ✅ **Real-time Tracking**: Live location tracking during services
- ✅ **Emergency Contacts**: Quick access to emergency services
- ✅ **Secure Payments**: Bank-level encryption for all transactions
- ✅ **Rating & Reviews**: Community-driven safety through reviews

## 💰 Pricing Structure

### Service Pricing (Base prices in ZAR)
- **House Cleaning**: R400/day (4-8 hours)
- **Garden Maintenance**: R350/day (4-6 hours)
- **Car Wash**: 
  - Interior Only: R150
  - Exterior Only: R120
  - Full Sedan: R200
  - Full SUV: R250

### Commission Structure
- **App Commission**: 10% per transaction
- **Service Provider Earnings**: 90% of service fee
- **Payment Schedule**: Weekly payouts every Friday

## 🏗️ Architecture

### Frontend (React Native)
```
src/
├── screens/
│   ├── auth/           # Authentication screens
│   ├── customer/       # Customer-specific screens
│   ├── provider/       # Service provider screens
│   └── shared/         # Shared components
├── services/           # API services
├── constants/          # App constants and configuration
└── utils/              # Utility functions
```

### Key Technologies
- **React Native 0.72.6**: Cross-platform mobile development
- **React Navigation**: Screen navigation
- **Axios**: HTTP client for API calls
- **AsyncStorage**: Local data persistence
- **Stripe**: Payment processing
- **Socket.io**: Real-time communication
- **React Native Maps**: Location services

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)
- Yarn or npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd helperhive
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Install iOS dependencies** (iOS only)
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   API_BASE_URL=http://localhost:3000/api
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
   GOOGLE_MAPS_API_KEY=your_google_maps_key
   ```

### Running the App

1. **Start Metro bundler**
   ```bash
   npx react-native start
   ```

2. **Run on Android**
   ```bash
   npx react-native run-android
   ```

3. **Run on iOS**
   ```bash
   npx react-native run-ios
   ```

## 🔧 Backend Setup

### Required Backend Services

The app requires a Node.js/Express backend with the following endpoints:

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/resend-otp` - Resend OTP

#### User Management
- `GET /api/user/profile` - Get user profile
- `PATCH /api/user/profile` - Update user profile
- `POST /api/user/emergency-contact` - Add emergency contact

#### Booking Management
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings
- `PATCH /api/bookings/:id/status` - Update booking status
- `GET /api/bookings/:id/track` - Track booking

#### Service Provider
- `POST /api/providers/documents` - Upload verification documents
- `PATCH /api/providers/availability` - Update availability
- `GET /api/providers/earnings` - Get earnings data
- `GET /api/providers/job-requests` - Get job requests

#### Payments
- `POST /api/payments/create-intent` - Create Stripe payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/history` - Get payment history

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  user_type ENUM('customer', 'service_provider') NOT NULL,
  province VARCHAR(100),
  city VARCHAR(100),
  verification_status ENUM('pending', 'approved', 'rejected', 'under_review'),
  is_available BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Bookings Table
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES users(id),
  provider_id UUID REFERENCES users(id),
  service_type VARCHAR(50) NOT NULL,
  service_options JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  scheduled_for TIMESTAMP,
  address TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 📱 App Flow

### Customer Journey
1. **Registration**: Choose customer account type
2. **Service Selection**: Pick from cleaning, gardening, or car wash
3. **Customization**: Select specific options and requirements
4. **Booking**: Schedule service and provide location
5. **Payment**: Secure payment processing
6. **Tracking**: Real-time service provider tracking
7. **Completion**: Rate and review service

### Service Provider Journey
1. **Registration**: Sign up as service provider
2. **Verification**: Upload required documents
3. **Approval**: Wait for background check completion
4. **Availability**: Turn on availability to receive jobs
5. **Job Acceptance**: Accept or decline job requests
6. **Service Delivery**: Complete the booked service
7. **Payment**: Receive weekly payouts

## 🔐 Security Implementation

### Authentication Security
- JWT tokens with expiration
- OTP verification via email/SMS
- Password strength requirements
- Account lockout after failed attempts

### Data Protection
- All API calls use HTTPS
- Sensitive data encryption at rest
- PCI DSS compliance for payments
- GDPR compliance for user data

### Background Verification
- South African ID verification
- Police clearance certificates
- Address verification
- Reference checks

## 🌍 South African Compliance

### Local Requirements
- **Currency**: All payments in South African Rand (ZAR)
- **Language**: English with local terminology
- **Legal**: Compliance with South African labor and business laws
- **Banking**: Integration with South African payment systems
- **Geography**: Support for all 9 provinces

### Phone Number Format
- Supports `+27` country code
- Validates South African mobile numbers (081, 082, 083, etc.)

## 📈 Scalability Features

### Real-time Communication
- Socket.io for live tracking
- Push notifications for job updates
- Real-time chat support

### Performance Optimization
- Image optimization and caching
- Lazy loading for screens
- Efficient state management
- Background API calls

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### E2E Testing
```bash
# Add Detox or Appium tests
npx detox test
```

## 📦 Build & Deployment

### Android
```bash
cd android
./gradlew assembleRelease
```

### iOS
```bash
cd ios
xcodebuild -workspace HelperHive.xcworkspace -scheme HelperHive -configuration Release
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and inquiries:
- **Email**: support@helperhive.co.za
- **Phone**: +27 11 123 4567
- **Website**: https://helperhive.co.za

## 🔮 Future Features

### Phase 2 Enhancements
- [ ] Multi-language support (Afrikaans, Zulu, etc.)
- [ ] AI-powered service matching
- [ ] Subscription services for regular customers
- [ ] Corporate accounts for businesses
- [ ] Equipment rental marketplace
- [ ] Weather-based scheduling
- [ ] Video verification calls
- [ ] Carbon footprint tracking

### Integration Roadmap
- [ ] Integration with local banks (FNB, Standard Bank, etc.)
- [ ] Municipal service integration
- [ ] Insurance partner integration
- [ ] Fleet management for equipment
- [ ] Advanced analytics dashboard

---

**Made with ❤️ for South Africa** 🇿🇦