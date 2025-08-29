import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ToastAndroid } from 'react-native';
import API_BASE_URL from './ApiConfig'; // Import your API config

const { width } = Dimensions.get('window');

// Custom Eye Icon Component
const EyeIcon = ({ visible, color = '#666' }) => (
  <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
    {visible ? (
      // Eye Open Icon
      <View>
        <View style={{
          width: 18,
          height: 12,
          borderWidth: 1.5,
          borderColor: color,
          borderRadius: 9,
          position: 'relative',
        }} />
        <View style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
          position: 'absolute',
          top: 2,
          left: 5,
        }} />
        <View style={{
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: '#fff',
          position: 'absolute',
          top: 4,
          left: 7,
        }} />
      </View>
    ) : (
      // Eye Closed Icon
      <View>
        <View style={{
          width: 18,
          height: 12,
          borderWidth: 1.5,
          borderColor: color,
          borderRadius: 9,
          position: 'relative',
        }} />
        <View style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
          position: 'absolute',
          top: 2,
          left: 5,
        }} />
        <View style={{
          width: 20,
          height: 2,
          backgroundColor: color,
          position: 'absolute',
          top: 5,
          left: -1,
          transform: [{ rotate: '45deg' }],
        }} />
      </View>
    )}
  </View>
);

const ForgotPassword = () => {
  // State management
  const [formData, setFormData] = useState({
    phone: '',
    otp: '',
    password: '',
    confirmPassword: ''
  });
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
    confirmPassword: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(true);
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  const navigation = useNavigation();

  // OTP Timer Effect
  useEffect(() => {
    let timer;
    if (otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else {
      setCanResendOtp(true);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [otpTimer]);

  // Show toast messages
  const showToast = (message) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('', message);
    }
  };

  // Input handlers
  const handleInputChange = (name, value) => {
    let processedValue = value;

    // Special handling for phone and OTP - numbers only
    if (name === 'phone' || name === 'otp') {
      processedValue = value.replace(/\D/g, '');
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Validate password requirements if password field changes
    if (name === 'password') {
      validatePassword(processedValue);
    }

    // Clear errors for the field being edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Password validation
  const validatePassword = (password) => {
    const newRequirements = {
      minLength: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    setPasswordRequirements(newRequirements);

    const errors = [];
    if (!newRequirements.minLength) errors.push("Password must be at least 8 characters long");
    if (!newRequirements.hasNumber) errors.push("Password must contain at least one number");
    if (!newRequirements.hasSpecialChar) errors.push("Password must contain at least one special character");

    return errors;
  };

  // API handlers
  const handleSendOtp = async () => {
    if (!canResendOtp && otpTimer > 0) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/send-otp`, {
        phoneNo: formData.phone
      });

      if (response.data.success) {
        showToast('OTP sent successfully');
        setOtpTimer(60); // Start 60 second timer
        setCanResendOtp(false);
        if (step === 1) {
          setStep(2);
        }
        // For development only - remove in production
        await AsyncStorage.setItem('debug_otp', response.data.debug.otp);
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send OTP';
      setErrors({
        phone: errorMessage
      });
      showToast(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    try {
      // For development - using stored OTP
      const storedOtp = await AsyncStorage.getItem('debug_otp');
      if (formData.otp !== storedOtp) {
        throw new Error('Invalid OTP');
      }
      setStep(3);
      showToast('OTP verified successfully');
    } catch (error) {
      console.error('Verify OTP error:', error);
      const errorMessage = error.message || 'Invalid OTP';
      setErrors({
        otp: errorMessage
      });
      showToast(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/reset-password`, {
        phoneNo: formData.phone,
        newPassword: formData.password
      });

      if (response.data.success) {
        showToast('Password reset successful');
        
        // Navigate to login page after a delay
        setTimeout(() => {
          navigation.navigate('Login'); // Adjust route name as needed
        }, 1500);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to reset password';
      setErrors({
        api: errorMessage
      });
      showToast(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Form submission handler
  const handleNext = async () => {
    setErrors({});

    if (step === 1) {
      if (formData.phone.length !== 10) {
        setErrors({ phone: "Please enter a valid 10-digit phone number" });
        return;
      }
      await handleSendOtp();
    } else if (step === 2) {
      if (formData.otp.length !== 6) {
        setErrors({ otp: "Please enter a valid 6-digit OTP" });
        return;
      }
      await handleVerifyOtp();
    } else if (step === 3) {
      const passwordErrors = validatePassword(formData.password);
      if (passwordErrors.length > 0) {
        setErrors({ password: passwordErrors });
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrors({ confirmPassword: "Passwords do not match" });
        return;
      }
      await handleResetPassword();
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Render password requirements
  const renderPasswordRequirements = () => (
    <View style={styles.passwordRequirements}>
      <Text style={styles.requirementsTitle}>Password must contain:</Text>
      <View style={styles.requirementItem}>
        <Text style={[styles.requirementText, passwordRequirements.minLength && styles.requirementMet]}>
          • At least 8 characters {passwordRequirements.minLength && <Text style={styles.checkMark}>✅</Text>}
        </Text>
      </View>
      <View style={styles.requirementItem}>
        <Text style={[styles.requirementText, passwordRequirements.hasNumber && styles.requirementMet]}>
          • At least 1 number {passwordRequirements.hasNumber && <Text style={styles.checkMark}>✅</Text>}
        </Text>
      </View>
      <View style={styles.requirementItem}>
        <Text style={[styles.requirementText, passwordRequirements.hasSpecialChar && styles.requirementMet]}>
          • At least 1 special character {passwordRequirements.hasSpecialChar && <Text style={styles.checkMark}>✅</Text>}
        </Text>
      </View>
    </View>
  );

  // Render error messages
  const renderError = (field) => {
    if (!errors[field]) return null;
    
    if (Array.isArray(errors[field])) {
      return (
        <View style={styles.errorContainer}>
          {errors[field].map((error, index) => (
            <Text key={index} style={styles.errorText}>• {error}</Text>
          ))}
        </View>
      );
    }
    
    return <Text style={styles.errorText}>{errors[field]}</Text>;
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#42a5f5" barStyle="light-content" />
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.mainContent}>
          <View style={styles.formSection}>
            <View style={styles.loginCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.headerTitle}>Reset Password</Text>
                <Text style={styles.headerSubtitle}>
                  {step === 1 ? "Enter your phone number" : 
                   step === 2 ? "Verify OTP" : 
                   "Create new password"}
                </Text>
              </View>

              <View style={styles.cardBody}>
                {/* Phone Input */}
                {step >= 1 && (
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Phone Number</Text>
                    <TextInput
                      style={[styles.formControl, errors.phone && styles.inputError]}
                      value={formData.phone}
                      onChangeText={(value) => handleInputChange('phone', value)}
                      placeholder="Enter your 10-digit phone number"
                      placeholderTextColor="rgba(255, 255, 255, 0.7)"
                      keyboardType="phone-pad"
                      maxLength={10}
                      editable={step === 1}
                    />
                    {renderError('phone')}
                  </View>
                )}

                {/* OTP Input */}
                {step >= 2 && (
                  <View style={styles.formGroup}>
                    <View style={styles.otpHeader}>
                      <Text style={styles.formLabel}>OTP</Text>
                      {otpTimer > 0 ? (
                        <Text style={styles.timerText}>Resend in {otpTimer}s</Text>
                      ) : (
                        <TouchableOpacity 
                          onPress={handleSendOtp}
                          disabled={!canResendOtp || isLoading}
                          style={styles.resendButton}
                        >
                          <Text style={[styles.resendText, (!canResendOtp || isLoading) && styles.disabledText]}>
                            Resend OTP
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <TextInput
                      style={[styles.formControl, errors.otp && styles.inputError]}
                      value={formData.otp}
                      onChangeText={(value) => handleInputChange('otp', value)}
                      placeholder="Enter 6-digit OTP"
                      placeholderTextColor="rgba(255, 255, 255, 0.7)"
                      keyboardType="numeric"
                      maxLength={6}
                    />
                    {renderError('otp')}
                  </View>
                )}

                {/* Password Inputs */}
                {step >= 3 && (
                  <>
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>New Password</Text>
                      <View style={styles.passwordInputContainer}>
                        <TextInput
                          style={[styles.formControl, styles.passwordInput, errors.password && styles.inputError]}
                          value={formData.password}
                          onChangeText={(value) => handleInputChange('password', value)}
                          placeholder="Enter new password"
                          placeholderTextColor="rgba(255, 255, 255, 0.7)"
                          secureTextEntry={!passwordVisibility.password}
                        />
                        <TouchableOpacity
                          style={styles.passwordToggle}
                          onPress={() => togglePasswordVisibility('password')}
                        >
                          <EyeIcon 
                            visible={passwordVisibility.password} 
                            color="rgba(255, 255, 255, 0.8)" 
                          />
                        </TouchableOpacity>
                      </View>
                      {renderPasswordRequirements()}
                      {renderError('password')}
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Confirm Password</Text>
                      <View style={styles.passwordInputContainer}>
                        <TextInput
                          style={[styles.formControl, styles.passwordInput, errors.confirmPassword && styles.inputError]}
                          value={formData.confirmPassword}
                          onChangeText={(value) => handleInputChange('confirmPassword', value)}
                          placeholder="Confirm new password"
                          placeholderTextColor="rgba(255, 255, 255, 0.7)"
                          secureTextEntry={!passwordVisibility.confirmPassword}
                        />
                        <TouchableOpacity
                          style={styles.passwordToggle}
                          onPress={() => togglePasswordVisibility('confirmPassword')}
                        >
                          <EyeIcon 
                            visible={passwordVisibility.confirmPassword} 
                            color="rgba(255, 255, 255, 0.8)" 
                          />
                        </TouchableOpacity>
                      </View>
                      {renderError('confirmPassword')}
                    </View>
                  </>
                )}

                <TouchableOpacity
                  style={[styles.btnPrimary, isLoading && styles.btnDisabled]}
                  onPress={handleNext}
                  disabled={isLoading}
                >
                  {isLoading && <ActivityIndicator size="small" color="#ffffff" style={styles.spinner} />}
                  <Text style={styles.btnText}>
                    {step === 1 ? "Send OTP" : step === 2 ? "Verify OTP" : "Reset Password"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.cardFooterText}>
                  Remember your password?{' '}
                  <Text 
                    style={styles.loginLink}
                    onPress={() => navigation.navigate('Login')}
                  >
                    Back to Login
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 30,
  },

  // Main Content
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 50,
  },

  // Form Section
  formSection: {
    marginBottom: 20,
  },
  loginCard: {
    backgroundColor: 'rgba(26, 42, 68, 0.95)',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    backgroundColor: '#42a5f5',
    padding: 25,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    marginTop: 6,
  },
  cardBody: {
    padding: 25,
    backgroundColor: '#1a2a44',
  },

  // Form Elements
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    color: '#ecf0f1',
    fontWeight: '500',
    marginBottom: 6,
    fontSize: 14,
  },
  formControl: {
    width: '100%',
    padding: 14,
    backgroundColor: 'rgba(52, 73, 94, 0.8)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    color: '#ffffff',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  passwordInputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    paddingRight: 50,
  },
  passwordToggle: {
    position: 'absolute',
    right: 15,
    borderRadius: 6,
    width: 35,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // OTP Header
  otpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  resendButton: {
    padding: 5,
  },
  resendText: {
    color: '#42a5f5',
    fontSize: 12,
    fontWeight: '500',
  },
  disabledText: {
    color: '#6c757d',
    opacity: 0.6,
  },

  // Password Requirements
  passwordRequirements: {
    marginTop: 8,
    backgroundColor: 'rgba(52, 73, 94, 0.3)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  requirementsTitle: {
    color: '#ecf0f1',
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '500',
  },
  requirementItem: {
    marginBottom: 2,
  },
  requirementText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  requirementMet: {
    color: '#2ecc71',
  },
  checkMark: {
    color: '#2ecc71',
    fontWeight: 'bold',
  },

  // Error Messages
  errorContainer: {
    marginTop: 5,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 5,
  },

  // Button
  btnPrimary: {
    width: '100%',
    padding: 14,
    backgroundColor: '#42a5f5',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#42a5f5',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    marginTop: 10,
  },
  btnDisabled: {
    backgroundColor: 'rgba(108, 117, 125, 0.6)',
    opacity: 0.7,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  spinner: {
    marginRight: 8,
  },

  // Card Footer
  cardFooter: {
    backgroundColor: 'rgba(42, 82, 152, 0.3)',
    padding: 18,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardFooterText: {
    color: '#bdc3c7',
    fontSize: 14,
  },
  loginLink: {
    color: '#42a5f5',
    fontWeight: '500',
  },

  // Responsive Design for smaller screens
  ...(width < 380 && {
    scrollContainer: {
      paddingHorizontal: 10,
    },
    cardBody: {
      padding: 20,
    },
    formControl: {
      padding: 12,
    },
    btnPrimary: {
      padding: 12,
    },
  }),
});

export default ForgotPassword;