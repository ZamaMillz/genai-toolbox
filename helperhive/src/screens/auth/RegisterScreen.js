import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { COLORS, USER_TYPES, SA_PROVINCES } from '../../constants';
import { authService } from '../../services/api';

const RegisterScreen = ({ navigation, route }) => {
  const userType = route.params?.userType || USER_TYPES.CUSTOMER;
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    province: '',
    city: '',
    services: userType === USER_TYPES.SERVICE_PROVIDER ? [] : undefined,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const serviceOptions = [
    { label: 'Cleaning Services', value: 'cleaning' },
    { label: 'Gardening Services', value: 'gardening' },
    { label: 'Car Wash Services', value: 'car_wash' },
  ];

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleService = (service) => {
    const currentServices = formData.services || [];
    const isSelected = currentServices.includes(service);
    
    const updatedServices = isSelected
      ? currentServices.filter(s => s !== service)
      : [...currentServices, service];
    
    updateFormData('services', updatedServices);
  };

  const validateForm = () => {
    const { firstName, lastName, email, phone, password, confirmPassword, province, city } = formData;
    
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword || !province || !city) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (!isValidPhone(phone)) {
      Alert.alert('Error', 'Please enter a valid South African phone number');
      return false;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return false;
    }

    if (!isStrongPassword(password)) {
      Alert.alert('Error', 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (userType === USER_TYPES.SERVICE_PROVIDER && (!formData.services || formData.services.length === 0)) {
      Alert.alert('Error', 'Please select at least one service you can provide');
      return false;
    }

    if (!agreedToTerms) {
      Alert.alert('Error', 'Please agree to the Terms of Service and Privacy Policy');
      return false;
    }

    return true;
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone) => {
    // South African phone number validation
    const phoneRegex = /^(\+27|0)[6-8][0-9]{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const isStrongPassword = (password) => {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    return strongPasswordRegex.test(password);
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const registrationData = {
        ...formData,
        userType,
        phone: formData.phone.replace(/\s/g, ''), // Remove spaces
      };

      await authService.register(registrationData);
      
      Alert.alert(
        'Registration Successful',
        'Please check your email to verify your account before logging in.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login', { userType }),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Registration Failed', error.message || 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const getUserTypeTitle = () => {
    return userType === USER_TYPES.CUSTOMER ? 'Create Customer Account' : 'Become a Service Provider';
  };

  const getUserTypeColor = () => {
    return userType === USER_TYPES.CUSTOMER ? COLORS.primary : COLORS.secondary;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{getUserTypeTitle()}</Text>
            <Text style={styles.subtitle}>
              {userType === USER_TYPES.CUSTOMER 
                ? 'Join thousands of satisfied customers'
                : 'Start earning with your skills today'
              }
            </Text>
          </View>

          <View style={styles.form}>
            {/* Personal Information */}
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.firstName}
                  onChangeText={(value) => updateFormData('firstName', value)}
                  placeholder="First name"
                  autoCapitalize="words"
                />
              </View>
              
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.lastName}
                  onChangeText={(value) => updateFormData('lastName', value)}
                  placeholder="Last name"
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(value) => updateFormData('phone', value)}
                placeholder="e.g., +27 81 123 4567"
                keyboardType="phone-pad"
              />
            </View>

            {/* Location Information */}
            <Text style={styles.sectionTitle}>Location</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Province *</Text>
              <RNPickerSelect
                onValueChange={(value) => updateFormData('province', value)}
                items={SA_PROVINCES.map(province => ({ label: province, value: province }))}
                placeholder={{ label: 'Select your province', value: null }}
                style={pickerSelectStyles}
                value={formData.province}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(value) => updateFormData('city', value)}
                placeholder="Enter your city"
                autoCapitalize="words"
              />
            </View>

            {/* Service Provider Specific */}
            {userType === USER_TYPES.SERVICE_PROVIDER && (
              <>
                <Text style={styles.sectionTitle}>Services You Provide</Text>
                <Text style={styles.sectionSubtitle}>Select all services you can provide *</Text>
                
                {serviceOptions.map((service) => (
                  <TouchableOpacity
                    key={service.value}
                    style={[
                      styles.serviceOption,
                      formData.services?.includes(service.value) && styles.serviceOptionSelected
                    ]}
                    onPress={() => toggleService(service.value)}
                  >
                    <View style={[
                      styles.checkbox,
                      formData.services?.includes(service.value) && styles.checkboxSelected
                    ]}>
                      {formData.services?.includes(service.value) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                    <Text style={styles.serviceOptionText}>{service.label}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Password */}
            <Text style={styles.sectionTitle}>Security</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  placeholder="Create a strong password"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.passwordToggleText}>
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.passwordHint}>
                Must be 8+ characters with uppercase, lowercase, number & special character
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateFormData('confirmPassword', value)}
                  placeholder="Confirm your password"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Text style={styles.passwordToggleText}>
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms and Conditions */}
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
            >
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxSelected]}>
                {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={[styles.termsLink, { color: getUserTypeColor() }]}>
                  Terms of Service
                </Text>
                {' '}and{' '}
                <Text style={[styles.termsLink, { color: getUserTypeColor() }]}>
                  Privacy Policy
                </Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: getUserTypeColor() }]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login', { userType })}
            >
              <Text style={styles.loginText}>
                Already have an account?{' '}
                <Text style={[styles.loginLink, { color: getUserTypeColor() }]}>
                  Sign In
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 20,
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  backIcon: {
    fontSize: 20,
    color: COLORS.text.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    lineHeight: 22,
  },
  form: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
    marginTop: 24,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    marginBottom: 20,
  },
  halfWidth: {
    width: '48%',
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
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  passwordToggleText: {
    fontSize: 20,
  },
  passwordHint: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  serviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  serviceOptionSelected: {
    borderColor: COLORS.secondary,
    backgroundColor: '#f0f9ff',
  },
  serviceOptionText: {
    fontSize: 16,
    color: COLORS.text.primary,
    marginLeft: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 24,
  },
  termsText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  termsLink: {
    fontWeight: '600',
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    alignItems: 'center',
    padding: 16,
  },
  loginText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  loginLink: {
    fontWeight: '600',
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text.primary,
  },
  inputAndroid: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text.primary,
  },
});

export default RegisterScreen;