import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { COLORS, SERVICE_TYPES, SERVICE_PRICING } from '../../constants';
import { bookingService, userService } from '../../services/api';

const CustomerHomeScreen = ({ navigation }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadUserData();
    loadRecentBookings();
  }, []);

  const loadUserData = async () => {
    try {
      const profile = await userService.getProfile();
      setUserName(profile.firstName);
      setUserLocation({
        city: profile.city,
        province: profile.province,
      });
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const loadRecentBookings = async () => {
    try {
      const bookings = await bookingService.getBookings();
      setRecentBookings(bookings.slice(0, 3)); // Show last 3 bookings
    } catch (error) {
      console.error('Failed to load bookings:', error);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadUserData(), loadRecentBookings()]);
    setIsRefreshing(false);
  };

  const handleServiceSelect = (serviceType) => {
    navigation.navigate('ServiceSelection', { serviceType });
  };

  const handleViewAllBookings = () => {
    navigation.navigate('Bookings');
  };

  const handleEmergencyContact = () => {
    Alert.alert(
      'Emergency Contact',
      'Would you like to contact emergency services or your emergency contact?',
      [
        { text: 'Emergency Services', onPress: () => {} },
        { text: 'My Emergency Contact', onPress: () => {} },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const services = [
    {
      id: SERVICE_TYPES.CLEANING,
      title: 'House Cleaning',
      description: 'Professional cleaning services',
      icon: '🧹',
      price: `R${SERVICE_PRICING[SERVICE_TYPES.CLEANING].base_price}`,
      color: '#3B82F6',
    },
    {
      id: SERVICE_TYPES.GARDENING,
      title: 'Garden Care',
      description: 'Lawn & garden maintenance',
      icon: '🌱',
      price: `R${SERVICE_PRICING[SERVICE_TYPES.GARDENING].base_price}`,
      color: '#10B981',
    },
    {
      id: SERVICE_TYPES.CAR_WASH,
      title: 'Car Wash',
      description: 'Professional car cleaning',
      icon: '🚗',
      price: 'From R120',
      color: '#F59E0B',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>
                {getGreeting()}, {userName}!
              </Text>
              <View style={styles.locationContainer}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.location}>
                  {userLocation ? `${userLocation.city}, ${userLocation.province}` : 'Loading location...'}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.profileIcon}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Emergency Button */}
        <TouchableOpacity 
          style={styles.emergencyButton}
          onPress={handleEmergencyContact}
        >
          <Text style={styles.emergencyIcon}>🚨</Text>
          <Text style={styles.emergencyText}>Emergency Contact</Text>
        </TouchableOpacity>

        {/* Services Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Book a Service</Text>
          <View style={styles.servicesContainer}>
            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={[styles.serviceCard, { borderColor: service.color }]}
                onPress={() => handleServiceSelect(service.id)}
              >
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceIcon}>{service.icon}</Text>
                  <Text style={styles.servicePrice}>{service.price}</Text>
                </View>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                <Text style={styles.serviceDescription}>{service.description}</Text>
                <View style={[styles.bookButton, { backgroundColor: service.color }]}>
                  <Text style={styles.bookButtonText}>Book Now</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Bookings */}
        {recentBookings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Bookings</Text>
              <TouchableOpacity onPress={handleViewAllBookings}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {recentBookings.map((booking) => (
              <TouchableOpacity 
                key={booking.id} 
                style={styles.bookingCard}
                onPress={() => navigation.navigate('Tracking', { bookingId: booking.id })}
              >
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingService}>{booking.serviceName}</Text>
                  <Text style={[styles.bookingStatus, { color: getStatusColor(booking.status) }]}>
                    {booking.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.bookingDate}>{new Date(booking.createdAt).toLocaleDateString()}</Text>
                <Text style={styles.bookingAmount}>R{booking.totalAmount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Support')}
            >
              <Text style={styles.quickActionIcon}>💬</Text>
              <Text style={styles.quickActionText}>Support</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={handleViewAllBookings}
            >
              <Text style={styles.quickActionIcon}>📋</Text>
              <Text style={styles.quickActionText}>My Bookings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Payment')}
            >
              <Text style={styles.quickActionIcon}>💳</Text>
              <Text style={styles.quickActionText}>Payments</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Safety Notice */}
        <View style={styles.safetyNotice}>
          <Text style={styles.safetyIcon}>🔒</Text>
          <Text style={styles.safetyText}>
            All service providers are verified and background checked for your safety
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case 'completed': return COLORS.success;
    case 'in_progress': return COLORS.warning;
    case 'cancelled': return COLORS.danger;
    default: return COLORS.primary;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  location: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 20,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger,
    marginHorizontal: 24,
    marginTop: -15,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emergencyIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  emergencyText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  servicesContainer: {
    gap: 16,
  },
  serviceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceIcon: {
    fontSize: 32,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 16,
  },
  bookButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  bookingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingService: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  bookingStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  bookingDate: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  bookingAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  safetyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    marginHorizontal: 24,
    marginTop: 32,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  safetyIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  safetyText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    flex: 1,
    lineHeight: 16,
  },
});

export default CustomerHomeScreen;