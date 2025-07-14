# HelperHive - Home Service Booking Platform

A comprehensive on-demand home service booking platform built for South Africa, similar to Bolt/Uber/Indrive but focused on home and personal care services. Built with Node.js, React, MongoDB, and real-time features.

## 🌟 Features

### 🏠 Service Categories
- **Cleaning Services**: House cleaning, deep cleaning
- **Pet Care**: Pet sitting, dog walking, grooming
- **Beauty & Personal Care**: Hairdressing, massage therapy, makeup artist, nail technician
- **Gardening**: Garden maintenance, lawn mowing, landscaping
- **Automotive**: Car wash (interior, exterior, full sedan, full SUV)

### 👥 User Types

#### **Customers**
- Browse and book services
- Real-time provider tracking
- In-app messaging and calls
- Secure payment processing
- Rating and review system
- Emergency alert button
- Booking history and management

#### **Service Providers**
- Profile creation and verification
- Service offerings management
- Real-time booking notifications
- Location tracking during service
- Earnings dashboard
- Weekly payouts
- Document verification system

#### **Admin Dashboard**
- User management and verification
- Booking and dispute management
- Financial reporting
- Platform settings
- Provider approval workflow

## 🛠 Tech Stack

### Backend
- **Framework**: Node.js with Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcrypt
- **Real-time**: Socket.IO
- **Payments**: Stripe integration
- **File Upload**: Multer
- **Validation**: Joi
- **Security**: Helmet, rate limiting, CORS

### Frontend
- **Framework**: React 18 with hooks
- **Routing**: React Router v6
- **State Management**: Zustand with persistence
- **Styling**: Tailwind CSS with custom components
- **HTTP Client**: Axios with interceptors
- **Data Fetching**: React Query
- **Payments**: Stripe Elements
- **Maps**: React Leaflet
- **Real-time**: Socket.IO client

### Key Features
- **Mobile-first responsive design**
- **Real-time location tracking**
- **Secure payment processing**
- **Document verification system**
- **Emergency alert system**
- **In-app messaging**
- **Push notifications**
- **Geolocation services**

## 🏗 Architecture

```
helperhive/
├── server/                     # Backend API
│   ├── models/                # Database models
│   │   ├── User.js           # User model with customer/provider profiles
│   │   ├── Service.js        # Service definitions
│   │   └── Booking.js        # Booking management
│   ├── routes/               # API routes
│   │   ├── auth.js          # Authentication endpoints
│   │   ├── users.js         # User management
│   │   ├── services.js      # Service operations
│   │   ├── bookings.js      # Booking flow
│   │   ├── payments.js      # Payment processing
│   │   └── admin.js         # Admin operations
│   ├── middleware/          # Custom middleware
│   │   └── auth.js         # JWT authentication
│   ├── seeders/            # Database seeders
│   │   └── services.js     # Seed service data
│   └── index.js            # Server entry point
├── client/                    # Frontend React app
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Route components
│   │   ├── store/          # Zustand state management
│   │   ├── utils/          # API utilities
│   │   └── App.js          # Main app component
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── package.json              # Backend dependencies
├── .env.example             # Environment variables template
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Stripe account for payments
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd helperhive
```

2. **Install backend dependencies**
```bash
npm install
```

3. **Install frontend dependencies**
```bash
cd client
npm install
cd ..
```

4. **Environment Setup**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/helperhive

# JWT Secret
JWT_SECRET=your-super-secure-jwt-secret-key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key

# Other configurations...
```

5. **Seed the database**
```bash
node server/seeders/services.js
```

6. **Start the development servers**
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client

# Or both together
npm run dev
```

7. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📱 User Flows

### Customer Journey
1. **Registration**: Sign up with email/phone
2. **Verification**: Verify phone number with OTP
3. **Browse Services**: Explore available services by category
4. **Book Service**: Select provider, choose date/time
5. **Payment**: Secure payment processing
6. **Track Provider**: Real-time location tracking
7. **Service Completion**: Rate and review

### Provider Journey
1. **Registration**: Sign up as service provider
2. **Profile Setup**: Complete profile and upload documents
3. **Verification**: Admin approval process
4. **Service Offerings**: Select services to provide
5. **Receive Bookings**: Get notified of new bookings
6. **Provide Service**: Update status and location
7. **Get Paid**: Weekly payouts to verified bank account

### Admin Operations
1. **Provider Verification**: Review and approve providers
2. **Document Verification**: Verify uploaded documents
3. **User Management**: Manage customer and provider accounts
4. **Booking Oversight**: Monitor and resolve disputes
5. **Financial Reports**: Track revenue and payouts
6. **Platform Settings**: Configure fees and policies

## 💰 Business Model

- **Platform Fee**: 10% on each completed transaction
- **Payment Processing**: Secure with Stripe
- **Provider Payouts**: Weekly transfers to verified accounts
- **Pricing**: Market-competitive rates in South African Rand (ZAR)

### Sample Pricing (ZAR)
- House Cleaning: R250 (fixed)
- Deep Cleaning: R400 (fixed)  
- Pet Sitting: R150/hour
- Dog Walking: R80/hour
- Hairdressing: R200 (fixed)
- Massage Therapy: R350/hour
- Garden Maintenance: R200/hour
- Car Wash Full: R200-250

## 🔐 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control
- Phone number verification with OTP
- Email verification
- Password reset functionality

### Data Protection
- Encrypted passwords with bcrypt
- Secure API endpoints
- Rate limiting on sensitive operations
- CORS protection
- Input validation and sanitization

### Payment Security
- PCI-compliant payment processing with Stripe
- Secure tokenization
- Fraud detection
- Encrypted transaction data

### User Safety
- Provider background checks
- Document verification system
- Real-time location tracking
- Emergency alert button
- In-app messaging (no phone number sharing)
- User rating and review system

## 📊 Admin Dashboard Features

### Analytics & Reporting
- User growth metrics
- Booking statistics
- Revenue tracking
- Provider performance
- Service category analytics

### User Management
- Customer and provider listings
- Account verification status
- Suspension and activation controls
- Search and filtering capabilities

### Financial Management
- Transaction monitoring
- Platform fee tracking
- Provider payout management
- Refund processing
- Financial reports by period

### Content Management
- Service category management
- Pricing adjustments
- Platform settings
- Cancellation policies

## 🌍 South African Localization

### Regional Features
- All 9 provinces supported
- ZAR currency integration
- Local payment methods
- South African phone number validation
- Local service categories and pricing

### Provinces Covered
- Gauteng
- Western Cape
- KwaZulu-Natal
- Eastern Cape
- Free State
- Limpopo
- Mpumalanga
- Northern Cape
- North West

## 📱 Mobile Optimization

### Responsive Design
- Mobile-first approach
- Touch-friendly interface
- Optimized for small screens
- Fast loading times
- Offline capability planning

### PWA Features (Planned)
- Add to home screen
- Push notifications
- Offline functionality
- Background sync

## 🔄 Real-time Features

### Live Tracking
- Provider location updates
- ETA calculations
- Route optimization
- Status notifications

### Communication
- In-app messaging
- Voice calls (planned)
- System notifications
- Emergency alerts

## 🧪 Testing & Quality

### API Testing
- Unit tests with Jest
- Integration tests
- API endpoint testing
- Database operations testing

### Frontend Testing
- Component testing
- User flow testing
- Responsive design testing
- Cross-browser compatibility

## 🚀 Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database hosted (MongoDB Atlas)
- [ ] SSL certificates installed
- [ ] CDN configured for static assets
- [ ] Monitoring and logging setup
- [ ] Backup strategy implemented

### Recommended Hosting
- **Backend**: Railway, Heroku, or DigitalOcean
- **Frontend**: Vercel, Netlify, or AWS S3
- **Database**: MongoDB Atlas
- **File Storage**: AWS S3 or Cloudinary
- **CDN**: CloudFlare

## 📈 Future Enhancements

### Phase 2 Features
- [ ] Video calling integration
- [ ] AI-powered service matching
- [ ] Multi-language support (Afrikaans, Zulu, etc.)
- [ ] Subscription plans for frequent users
- [ ] Loyalty rewards program

### Phase 3 Features
- [ ] IoT device integration
- [ ] Advanced analytics with ML
- [ ] Enterprise customer features
- [ ] Franchise management system
- [ ] API for third-party integrations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@helperhive.com or create an issue in this repository.

## 👥 Team

Built by the HelperHive development team for the South African market.

---

**HelperHive** - Bringing professional home services to your doorstep across South Africa 🇿🇦
