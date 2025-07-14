import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
  StyleSheet,
} from 'react-native';
import { COLORS, USER_TYPES } from '../../constants';

const UserTypeSelection = ({ navigation }) => {
  const handleUserTypeSelect = (userType) => {
    navigation.navigate('Login', { userType });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo and Title */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>🏠</Text>
          </View>
          <Text style={styles.title}>HelperHive</Text>
          <Text style={styles.subtitle}>
            Your trusted home services platform
          </Text>
        </View>

        {/* User Type Selection */}
        <View style={styles.selectionContainer}>
          <Text style={styles.selectionTitle}>I want to:</Text>

          <TouchableOpacity
            style={[styles.optionButton, styles.customerButton]}
            onPress={() => handleUserTypeSelect(USER_TYPES.CUSTOMER)}
          >
            <View style={styles.optionIcon}>
              <Text style={styles.iconText}>👤</Text>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Book Services</Text>
              <Text style={styles.optionDescription}>
                Find and hire trusted service providers for your home
              </Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionButton, styles.providerButton]}
            onPress={() => handleUserTypeSelect(USER_TYPES.SERVICE_PROVIDER)}
          >
            <View style={styles.optionIcon}>
              <Text style={styles.iconText}>🔧</Text>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Provide Services</Text>
              <Text style={styles.optionDescription}>
                Earn money by offering cleaning, gardening, and car wash services
              </Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Why choose HelperHive?</Text>
          <View style={styles.featuresList}>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Verified service providers</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Secure payments in ZAR</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Real-time tracking</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>24/7 support</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  selectionContainer: {
    marginBottom: 40,
  },
  selectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  customerButton: {
    borderColor: COLORS.primary,
  },
  providerButton: {
    borderColor: COLORS.secondary,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 30,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  arrow: {
    fontSize: 20,
    color: COLORS.text.secondary,
  },
  featuresContainer: {
    marginTop: 'auto',
    marginBottom: 40,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresList: {
    gap: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 16,
    color: COLORS.success,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
});

export default UserTypeSelection;