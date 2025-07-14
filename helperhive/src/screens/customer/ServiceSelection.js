import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { COLORS, SERVICE_TYPES, SERVICE_PRICING, APP_COMMISSION_RATE } from '../../constants';

const ServiceSelection = ({ navigation, route }) => {
  const { serviceType } = route.params;
  const [selectedOptions, setSelectedOptions] = useState({});
  const [needsEquipment, setNeedsEquipment] = useState(false);
  const [hasWaterAccess, setHasWaterAccess] = useState(false);

  const getServiceConfig = () => {
    switch (serviceType) {
      case SERVICE_TYPES.CLEANING:
        return {
          title: 'House Cleaning',
          icon: '🧹',
          options: [
            { id: 'basic', name: 'Basic Cleaning', price: 400, description: 'General cleaning, dusting, mopping' },
            { id: 'deep', name: 'Deep Cleaning', price: 600, description: 'Thorough cleaning including appliances' },
            { id: 'maintenance', name: 'Maintenance Clean', price: 300, description: 'Light cleaning for regular upkeep' },
          ],
          equipmentRequired: true,
          waterRequired: false,
        };
      
      case SERVICE_TYPES.GARDENING:
        return {
          title: 'Garden Care',
          icon: '🌱',
          options: [
            { id: 'basic', name: 'Lawn Mowing', price: 250, description: 'Grass cutting and edging' },
            { id: 'maintenance', name: 'Garden Maintenance', price: 350, description: 'Weeding, pruning, general care' },
            { id: 'landscaping', name: 'Landscaping', price: 500, description: 'Design and plant arrangement' },
          ],
          equipmentRequired: true,
          waterRequired: false,
        };
      
      case SERVICE_TYPES.CAR_WASH:
        return {
          title: 'Car Wash',
          icon: '🚗',
          options: [
            { id: 'internal_only', name: 'Interior Only', price: 150, description: 'Vacuum, wipe interior surfaces' },
            { id: 'external_only', name: 'Exterior Only', price: 120, description: 'Wash and dry exterior' },
            { id: 'full_sedan', name: 'Full Wash - Sedan', price: 200, description: 'Complete interior and exterior' },
            { id: 'full_suv', name: 'Full Wash - SUV', price: 250, description: 'Complete interior and exterior' },
          ],
          equipmentRequired: true,
          waterRequired: true,
        };
      
      default:
        return null;
    }
  };

  const serviceConfig = getServiceConfig();

  const handleOptionSelect = (optionId) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionId]: !prev[optionId]
    }));
  };

  const getSelectedOptions = () => {
    return serviceConfig.options.filter(option => selectedOptions[option.id]);
  };

  const calculateTotal = () => {
    const selected = getSelectedOptions();
    const subtotal = selected.reduce((sum, option) => sum + option.price, 0);
    const commission = subtotal * APP_COMMISSION_RATE;
    return {
      subtotal,
      commission,
      total: subtotal + commission,
    };
  };

  const handleContinue = () => {
    const selected = getSelectedOptions();
    
    if (selected.length === 0) {
      Alert.alert('Error', 'Please select at least one service option');
      return;
    }

    if (serviceConfig.waterRequired && !hasWaterAccess) {
      Alert.alert('Error', 'Water access is required for car wash services');
      return;
    }

    const bookingData = {
      serviceType,
      selectedOptions: selected,
      needsEquipment,
      hasWaterAccess,
      pricing: calculateTotal(),
    };

    navigation.navigate('Booking', { bookingData });
  };

  if (!serviceConfig) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Service not found</Text>
      </SafeAreaView>
    );
  }

  const { subtotal, commission, total } = calculateTotal();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{serviceConfig.title}</Text>
        <View style={styles.headerIcon}>
          <Text style={styles.serviceIcon}>{serviceConfig.icon}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Service Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Services</Text>
          <Text style={styles.sectionSubtitle}>Choose the services you need</Text>
          
          {serviceConfig.options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                selectedOptions[option.id] && styles.optionCardSelected
              ]}
              onPress={() => handleOptionSelect(option.id)}
            >
              <View style={styles.optionHeader}>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionName}>{option.name}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                <View style={styles.optionPrice}>
                  <Text style={styles.priceText}>R{option.price}</Text>
                </View>
              </View>
              
              <View style={[
                styles.checkbox,
                selectedOptions[option.id] && styles.checkboxSelected
              ]}>
                {selectedOptions[option.id] && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Equipment Section */}
        {serviceConfig.equipmentRequired && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Equipment</Text>
            <TouchableOpacity
              style={styles.toggleCard}
              onPress={() => setNeedsEquipment(!needsEquipment)}
            >
              <View style={styles.toggleContent}>
                <View>
                  <Text style={styles.toggleTitle}>I need equipment provided</Text>
                  <Text style={styles.toggleDescription}>
                    Service provider will bring all necessary equipment
                  </Text>
                </View>
                <View style={[
                  styles.toggle,
                  needsEquipment && styles.toggleActive
                ]}>
                  <View style={[
                    styles.toggleKnob,
                    needsEquipment && styles.toggleKnobActive
                  ]} />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Water Access for Car Wash */}
        {serviceConfig.waterRequired && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Water Access</Text>
            <TouchableOpacity
              style={styles.toggleCard}
              onPress={() => setHasWaterAccess(!hasWaterAccess)}
            >
              <View style={styles.toggleContent}>
                <View>
                  <Text style={styles.toggleTitle}>Water is available on premises</Text>
                  <Text style={styles.toggleDescription}>
                    Required for car washing services
                  </Text>
                </View>
                <View style={[
                  styles.toggle,
                  hasWaterAccess && styles.toggleActive
                ]}>
                  <View style={[
                    styles.toggleKnob,
                    hasWaterAccess && styles.toggleKnobActive
                  ]} />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Pricing Breakdown */}
        {getSelectedOptions().length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing Breakdown</Text>
            <View style={styles.pricingCard}>
              {getSelectedOptions().map((option) => (
                <View key={option.id} style={styles.pricingRow}>
                  <Text style={styles.pricingItem}>{option.name}</Text>
                  <Text style={styles.pricingAmount}>R{option.price}</Text>
                </View>
              ))}
              
              <View style={styles.pricingDivider} />
              
              <View style={styles.pricingRow}>
                <Text style={styles.pricingItem}>Subtotal</Text>
                <Text style={styles.pricingAmount}>R{subtotal}</Text>
              </View>
              
              <View style={styles.pricingRow}>
                <Text style={styles.pricingItem}>Service Fee (10%)</Text>
                <Text style={styles.pricingAmount}>R{commission.toFixed(2)}</Text>
              </View>
              
              <View style={styles.pricingDivider} />
              
              <View style={styles.pricingRow}>
                <Text style={styles.pricingTotal}>Total</Text>
                <Text style={styles.pricingTotalAmount}>R{total.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Safety Notice */}
        <View style={styles.safetyNotice}>
          <Text style={styles.safetyIcon}>🔒</Text>
          <Text style={styles.safetyText}>
            All service providers are background checked and insured
          </Text>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            getSelectedOptions().length === 0 && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={getSelectedOptions().length === 0}
        >
          <Text style={styles.continueButtonText}>
            Continue to Booking
            {total > 0 && ` • R${total.toFixed(2)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: COLORS.text.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceIcon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 16,
  },
  optionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#f0f9ff',
  },
  optionHeader: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  optionPrice: {
    marginLeft: 16,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  toggleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ffffff',
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  pricingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  pricingItem: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  pricingAmount: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  pricingTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  pricingTotalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  pricingDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  safetyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    marginTop: 24,
    marginBottom: 100,
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
  footer: {
    padding: 24,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ServiceSelection;