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
import { COLORS, USER_TYPES } from '../../constants';
import { authService } from '../../services/api';

const LoginScreen = ({ navigation, route }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isOTPRequired, setIsOTPRequired] = useState(false);
  const [otp, setOtp] = useState('');

  const userType = route.params?.userType || USER_TYPES.CUSTOMER;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login(email, password, userType);
      
      if (response.requiresOTP) {
        setIsOTPRequired(true);
        Alert.alert('Security Check', 'An OTP has been sent to your email for verification');
      } else {
        // Login successful, navigation will be handled by App.js
        console.log('Login successful');
      }
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Please check your credentials and try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerification = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);

    try {
      await authService.verifyOTP(email, otp);
      // OTP verified, login successful
      console.log('OTP verified, login successful');
    } catch (error) {
      Alert.alert('Verification Failed', error.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await authService.resendOTP(email);
      Alert.alert('OTP Sent', 'A new OTP has been sent to your email');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getUserTypeTitle = () => {
    return userType === USER_TYPES.CUSTOMER ? 'Customer Login' : 'Service Provider Login';
  };

  const getUserTypeColor = () => {
    return userType === USER_TYPES.CUSTOMER ? COLORS.primary : COLORS.secondary;
  };

  if (isOTPRequired) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Verify Your Identity</Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit code sent to {email}
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Verification Code</Text>
                <TextInput
                  style={styles.otpInput}
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="Enter 6-digit code"
                  keyboardType="numeric"
                  maxLength={6}
                  textAlign="center"
                  fontSize={24}
                  letterSpacing={8}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: getUserTypeColor() }]}
                onPress={handleOTPVerification}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Verify</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.linkButton} onPress={handleResendOTP}>
                <Text style={[styles.linkText, { color: getUserTypeColor() }]}>
                  Didn't receive code? Resend
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.linkButton} 
                onPress={() => setIsOTPRequired(false)}
              >
                <Text style={styles.linkText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

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
              Welcome back! Please sign in to continue
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
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
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: getUserTypeColor() }]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkButton}>
              <Text style={[styles.linkText, { color: getUserTypeColor() }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => navigation.navigate('Register', { userType })}
            >
              <Text style={styles.registerText}>
                Don't have an account?{' '}
                <Text style={[styles.registerLink, { color: getUserTypeColor() }]}>
                  Sign Up
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Text style={styles.securityIcon}>🔒</Text>
            <Text style={styles.securityText}>
              Your data is protected with bank-level security
            </Text>
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
  },
  header: {
    paddingTop: 20,
    marginBottom: 40,
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
  inputContainer: {
    marginBottom: 24,
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
  otpInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text.primary,
    fontWeight: 'bold',
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
  linkButton: {
    alignItems: 'center',
    padding: 8,
  },
  linkText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  registerButton: {
    alignItems: 'center',
    padding: 16,
  },
  registerText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  registerLink: {
    fontWeight: '600',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  securityIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  securityText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
});

export default LoginScreen;