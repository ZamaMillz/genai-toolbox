# HelperHive - React Native Implementation

A comprehensive on-demand service booking platform for Android and iOS.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)
- Firebase account
- Stripe account

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/helperhive.git
cd helperhive

# Install dependencies
npm install

# For iOS only - install pods
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## 📱 Features

### Consumer App
- ✅ User Registration/Login
- ✅ Service Selection (Cleaning, Gardening, Car Wash, etc.)
- ✅ Booking Flow with Date/Time selection
- ✅ Real-Time Tracking
- ✅ In-App Chat/Call
- ✅ Emergency Button & SOS
- ✅ Secure Payment Integration
- ✅ Ratings & Reviews

### Service Provider App
- ✅ Self-Registration & Profile Setup
- ✅ Job Alerts & Acceptance
- ✅ Earnings Dashboard
- ✅ In-App Navigation
- ✅ Job Status Updates

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React Native + NativeWind (TailwindCSS) |
| Authentication | Firebase Auth |
| Database | Firestore |
| Payments | Stripe |
| Maps | React Native Maps |
| Navigation | React Navigation |
| State Management | React Context |
| Testing | Jest + Detox |

## 📁 Project Structure

```
helperhive/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── EmergencyButton.js
│   │   ├── ServiceCard.js
│   │   └── LoadingSpinner.js
│   ├── screens/             # App screens
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── HomeScreen.js
│   │   ├── BookingScreen.js
│   │   ├── PaymentScreen.js
│   │   ├── TrackingScreen.js
│   │   └── ProfileScreen.js
│   ├── services/            # External services
│   │   ├── firebase.js
│   │   ├── api.js
│   │   └── payments.js
│   ├── navigation/          # Navigation configuration
│   │   └── index.js
│   ├── context/             # React Context
│   │   └── AuthContext.js
│   ├── hooks/               # Custom hooks
│   │   └── useAuth.js
│   ├── utils/               # Utility functions
│   │   └── helpers.js
│   └── assets/              # Images, fonts, etc.
├── App.js                   # Main app component
├── index.js                 # Entry point
└── package.json             # Dependencies
```

## 🔧 Configuration

### Firebase Setup
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication and Firestore
3. Add your configuration to `src/services/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### Stripe Setup
1. Create a Stripe account at https://stripe.com
2. Get your publishable key
3. Set up a backend endpoint for payment processing
4. Update `src/screens/PaymentScreen.js` with your key

### Maps Configuration
1. Get a Google Maps API key
2. Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="YOUR_API_KEY" />
```

## 🔐 Security Features

- **Authentication**: Firebase Auth with email/password
- **Data Encryption**: Firestore security rules
- **Payment Security**: Stripe PCI compliance
- **Location Privacy**: User consent required
- **Emergency Features**: SOS button with emergency contacts

## 📱 Core Components

### Authentication Flow
```javascript
// LoginScreen.js
const handleLogin = async () => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

### Service Booking
```javascript
// BookingScreen.js
const submitBooking = async () => {
  const bookingData = {
    serviceType,
    date,
    time,
    location,
    userId: user.uid,
    status: 'pending'
  };
  
  await addDoc(collection(db, 'bookings'), bookingData);
};
```

### Real-time Tracking
```javascript
// TrackingScreen.js
useEffect(() => {
  const unsubscribe = onSnapshot(doc(db, 'bookings', bookingId), (doc) => {
    setBooking(doc.data());
  });
  return unsubscribe;
}, []);
```

### Emergency Button
```javascript
// EmergencyButton.js
const triggerEmergency = () => {
  Alert.alert("Emergency", "Contact emergency services?", [
    { text: "Cancel" },
    { text: "Call Police", onPress: () => Linking.openURL('tel:10111') },
    { text: "Call Emergency", onPress: () => Linking.openURL('tel:112') }
  ]);
};
```

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### End-to-End Tests
```bash
# iOS
detox test --configuration ios.sim.debug

# Android
detox test --configuration android.emu.debug
```

## 🚀 Deployment

### Android
```bash
# Generate signed APK
cd android
./gradlew assembleRelease

# Upload to Google Play Console
```

### iOS
```bash
# Build for release
react-native run-ios --configuration Release

# Archive in Xcode and submit to App Store
```

## 📊 Performance Optimization

- **Code Splitting**: Dynamic imports for screens
- **Image Optimization**: WebP format for images
- **Caching**: React Query for API caching
- **Bundle Analysis**: Bundle analyzer for optimization

## 🔍 Monitoring & Analytics

- **Crash Reporting**: Firebase Crashlytics
- **Performance**: Firebase Performance
- **Analytics**: Firebase Analytics
- **User Behavior**: Custom event tracking

## 📋 Roadmap

### Phase 1 (MVP) - ✅ Complete
- User authentication
- Basic service booking
- Payment integration
- Real-time tracking

### Phase 2 (Enhancements)
- [ ] AI-powered service matching
- [ ] Video calling
- [ ] Advanced rating system
- [ ] Multi-language support

### Phase 3 (Scale)
- [ ] IoT integration
- [ ] Advanced analytics
- [ ] Machine learning recommendations
- [ ] Enterprise features

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@helperhive.com or join our Slack channel.

## 🌟 Acknowledgments

- React Native team for the framework
- Firebase for backend services
- Stripe for payment processing
- Community contributors

---

Built with ❤️ by the HelperHive Team
