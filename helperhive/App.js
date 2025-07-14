import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Auth Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import UserTypeSelection from './src/screens/auth/UserTypeSelection';

// Customer Screens
import CustomerHomeScreen from './src/screens/customer/HomeScreen';
import ServiceSelection from './src/screens/customer/ServiceSelection';
import BookingScreen from './src/screens/customer/BookingScreen';
import TrackingScreen from './src/screens/customer/TrackingScreen';
import PaymentScreen from './src/screens/customer/PaymentScreen';

// Service Provider Screens
import ProviderHomeScreen from './src/screens/provider/HomeScreen';
import DocumentUpload from './src/screens/provider/DocumentUpload';
import JobAcceptance from './src/screens/provider/JobAcceptance';
import EarningsScreen from './src/screens/provider/EarningsScreen';

// Shared Screens
import ProfileScreen from './src/screens/shared/ProfileScreen';
import SupportScreen from './src/screens/shared/SupportScreen';

const Stack = createStackNavigator();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const type = await AsyncStorage.getItem('userType');
      
      if (token && type) {
        setIsAuthenticated(true);
        setUserType(type);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null; // Add splash screen component here
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen name="UserTypeSelection" component={UserTypeSelection} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : userType === 'customer' ? (
          // Customer Stack
          <>
            <Stack.Screen name="CustomerHome" component={CustomerHomeScreen} />
            <Stack.Screen name="ServiceSelection" component={ServiceSelection} />
            <Stack.Screen name="Booking" component={BookingScreen} />
            <Stack.Screen name="Tracking" component={TrackingScreen} />
            <Stack.Screen name="Payment" component={PaymentScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
          </>
        ) : (
          // Service Provider Stack
          <>
            <Stack.Screen name="ProviderHome" component={ProviderHomeScreen} />
            <Stack.Screen name="DocumentUpload" component={DocumentUpload} />
            <Stack.Screen name="JobAcceptance" component={JobAcceptance} />
            <Stack.Screen name="Earnings" component={EarningsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;