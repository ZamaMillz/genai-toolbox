import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DatePicker from '@react-native-community/datetimepicker';
import { COLORS } from '../../constants';
import { bookingService } from '../../services/api';

const BookingScreen = ({ navigation, route }) => {
  const { bookingData } = route.params;
  const [formData, setFormData] = useState({
    address: '',
    additionalInfo: '',
    preferredDate: new Date(),
    preferredTime: new Date(),
    emergencyContact: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.address.trim()) {
      Alert.alert('Error', 'Please provide your address');
      return false;
    }

    if (!formData.emergencyContact.trim()) {
      Alert.alert('Error', 'Please provide an emergency contact number');
      return false;
    }

    const selectedDateTime = new Date(formData.preferredDate);
    selectedDateTime.setHours(formData.preferredTime.getHours());
    selectedDateTime.setMinutes(formData.preferredTime.getMinutes());

    if (selectedDateTime <= new Date()) {
      Alert.alert('Error', 'Please select a future date and time');
      return false;
    }

    return true;
  };

  const handleBooking = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const booking = {
        ...bookingData,
        ...formData,
        preferredDateTime: new Date(
          formData.preferredDate.getFullYear(),
          formData.preferredDate.getMonth(),
          formData.preferredDate.getDate(),
          formData.preferredTime.getHours(),
          formData.preferredTime.getMinutes()
        ),
      };

      const response = await bookingService.createBooking(booking);

      Alert.alert(
        'Booking Confirmed!',
        'Your service has been booked successfully. You will be matched with a service provider shortly.',
        [
          {
            text: 'View Booking',
            onPress: () => navigation.navigate('Tracking', { bookingId: response.id }),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Booking Failed', error.message || 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time) => {
    return time.toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMinimumDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Complete Booking</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Service Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Summary</Text>
          <View style={styles.summaryCard}>
            {bookingData.selectedOptions.map((option) => (
              <View key={option.id} style={styles.summaryRow}>
                <Text style={styles.summaryItem}>{option.name}</Text>
                <Text style={styles.summaryPrice}>R{option.price}</Text>
              </View>
            ))}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotal}>Total</Text>
              <Text style={styles.summaryTotalPrice}>
                R{bookingData.pricing.total.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Location Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Details</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Service Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.address}
              onChangeText={(value) => updateFormData('address', value)}
              placeholder="Enter complete address including street, suburb, and any access instructions"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Additional Instructions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.additionalInfo}
              onChangeText={(value) => updateFormData('additionalInfo', value)}
              placeholder="Any special instructions or requirements (optional)"
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Scheduling */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Schedule</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Preferred Date *</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateTimeText}>
                📅 {formatDate(formData.preferredDate)}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Preferred Time *</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.dateTimeText}>
                🕐 {formatTime(formData.preferredTime)}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.scheduleNote}>
            💡 Service providers will contact you to confirm the exact time
          </Text>
        </View>

        {/* Emergency Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          <Text style={styles.sectionSubtitle}>
            Required for safety - someone we can contact if needed
          </Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Emergency Contact Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.emergencyContact}
              onChangeText={(value) => updateFormData('emergencyContact', value)}
              placeholder="e.g., +27 81 123 4567"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Equipment & Water Notice */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Requirements</Text>
          <View style={styles.requirementsList}>
            <View style={styles.requirementItem}>
              <Text style={styles.requirementIcon}>
                {bookingData.needsEquipment ? '✅' : '❌'}
              </Text>
              <Text style={styles.requirementText}>
                Equipment will be {bookingData.needsEquipment ? 'provided' : 'not provided'} by service provider
              </Text>
            </View>
            
            {bookingData.hasWaterAccess !== undefined && (
              <View style={styles.requirementItem}>
                <Text style={styles.requirementIcon}>
                  {bookingData.hasWaterAccess ? '✅' : '❌'}
                </Text>
                <Text style={styles.requirementText}>
                  Water is {bookingData.hasWaterAccess ? 'available' : 'not available'} on premises
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Safety Notice */}
        <View style={styles.safetyNotice}>
          <Text style={styles.safetyIcon}>🔒</Text>
          <View style={styles.safetyContent}>
            <Text style={styles.safetyTitle}>Your Safety Matters</Text>
            <Text style={styles.safetyText}>
              • All service providers are verified and background checked{'\n'}
              • Real-time tracking for your peace of mind{'\n'}
              • 24/7 support available during service
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Book Service Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={handleBooking}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.bookButtonText}>
              Book Service • R{bookingData.pricing.total.toFixed(2)}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DatePicker
          value={formData.preferredDate}
          mode="date"
          display="default"
          minimumDate={getMinimumDate()}
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) {
              updateFormData('preferredDate', date);
            }
          }}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DatePicker
          value={formData.preferredTime}
          mode="time"
          display="default"
          onChange={(event, time) => {
            setShowTimePicker(false);
            if (time) {
              updateFormData('preferredTime', time);
            }
          }}
        />
      )}
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
  placeholder: {
    width: 40,
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
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryItem: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  summaryPrice: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  summaryTotalPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text.primary,
  },
  textArea: {
    minHeight: 80,
  },
  dateTimeButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateTimeText: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  scheduleNote: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  requirementsList: {
    gap: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requirementIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  requirementText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    flex: 1,
  },
  safetyNotice: {
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
    marginTop: 24,
    marginBottom: 100,
    padding: 16,
    borderRadius: 12,
  },
  safetyIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  safetyContent: {
    flex: 1,
  },
  safetyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  safetyText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    lineHeight: 16,
  },
  footer: {
    padding: 24,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BookingScreen;