import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import API_BASE_URL from './ApiConfig';
import styles from './SignupStyles';

// Professional Eye Icons Component
const EyeIcon = ({ visible, color = '#666' }) => (
  <View
    style={{
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {visible ? (
      // Eye Open Icon
      <View>
        <View
          style={{
            width: 18,
            height: 12,
            borderWidth: 1.5,
            borderColor: color,
            borderRadius: 9,
            position: 'relative',
          }}
        />
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: color,
            position: 'absolute',
            top: 2,
            left: 5,
          }}
        />
        <View
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: '#fff',
            position: 'absolute',
            top: 4,
            left: 7,
          }}
        />
      </View>
    ) : (
      // Eye Closed Icon
      <View>
        <View
          style={{
            width: 18,
            height: 12,
            borderWidth: 1.5,
            borderColor: color,
            borderRadius: 9,
            position: 'relative',
          }}
        />
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: color,
            position: 'absolute',
            top: 2,
            left: 5,
          }}
        />
        <View
          style={{
            width: 20,
            height: 2,
            backgroundColor: color,
            position: 'absolute',
            top: 5,
            left: -1,
            transform: [{ rotate: '45deg' }],
          }}
        />
      </View>
    )}
  </View>
);

const SignupPage = () => {
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);

  // Create refs for form inputs to scroll to them
  const phoneInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const cityInputRef = useRef(null);
  const stateInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);
  const referralInputRef = useRef(null);
  const otpInputRef = useRef(null);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [referralId, setReferralId] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResendOtp, setCanResendOtp] = useState(false);

  const INDIAN_STATES = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
    'Andaman and Nicobar Islands',
    'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi',
    'Jammu and Kashmir',
    'Ladakh',
    'Lakshadweep',
    'Puducherry',
  ];

  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const [referralStatus, setReferralStatus] = useState({
    isValid: false,
    message: '',
    referrerName: '',
    isChecking: false,
  });

  // Function to scroll to first error
  const scrollToError = errorKey => {
    setTimeout(() => {
      let targetRef = null;

      switch (errorKey) {
        case 'phone':
          targetRef = phoneInputRef;
          break;
        case 'email':
          targetRef = emailInputRef;
          break;
        case 'city':
          targetRef = cityInputRef;
          break;
        case 'state':
          targetRef = stateInputRef;
          break;
        case 'password':
          targetRef = passwordInputRef;
          break;
        case 'confirmPassword':
          targetRef = confirmPasswordInputRef;
          break;
        case 'referralId':
          targetRef = referralInputRef;
          break;
        case 'otp':
          targetRef = otpInputRef;
          break;
        default:
          // Scroll to top if no specific input found
          scrollViewRef.current?.scrollTo({ y: 0, animated: true });
          return;
      }

      if (targetRef?.current) {
        targetRef.current.measureLayout(
          scrollViewRef.current,
          (x, y) => {
            scrollViewRef.current?.scrollTo({
              y: Math.max(0, y - 100), // Offset to show some space above the input
              animated: true,
            });
          },
          () => {
            // Fallback if measureLayout fails
            console.log('Failed to measure layout, scrolling to top');
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
          },
        );
      }
    }, 100); // Small delay to ensure the error state is rendered
  };

  // Load data from AsyncStorage (you'll need to implement this)
  useEffect(() => {
    // Implement AsyncStorage loading if needed
  }, []);

  // OTP Timer Effect
  useEffect(() => {
    let timer;
    if (otpSent && otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer(prevTimer => prevTimer - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setCanResendOtp(true);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [otpSent, otpTimer]);

  const validatePassword = password => {
    const newRequirements = {
      minLength: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    setPasswordRequirements(newRequirements);

    const errors = [];
    if (!newRequirements.minLength) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!newRequirements.hasNumber) {
      errors.push('Password must contain at least one number');
    }
    if (!newRequirements.hasSpecialChar) {
      errors.push('Password must contain at least one special character');
    }

    return errors;
  };

  const validatePhoneNumber = phoneNumber => {
    return /^\d{10}$/.test(phoneNumber);
  };

  const handlePasswordChange = newPassword => {
    setPassword(newPassword);
    validatePassword(newPassword);
  };

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const checkReferralId = async id => {
    if (!id.trim()) {
      setReferralStatus({
        isValid: false,
        message: 'Referral ID is required',
        referrerName: '',
        isChecking: false,
      });
      return;
    }

    setReferralStatus(prev => ({ ...prev, isChecking: true }));

    try {
      const response = await axios.get(
        `${API_BASE_URL}/checkReferralSlots/${id}`,
      );

      if (response.data.success) {
        if (response.data.slotsAvailable) {
          setReferralStatus({
            isValid: true,
            message: response.data.message,
            referrerName: response.data.referrerName,
            isChecking: false,
          });
        } else {
          setReferralStatus({
            isValid: false,
            message:
              'Both slots are occupied. Please use a different referral ID.',
            referrerName: '',
            isChecking: false,
          });
        }
      }
    } catch (error) {
      setReferralStatus({
        isValid: false,
        message: error.response?.data?.error || 'Invalid referral ID',
        referrerName: '',
        isChecking: false,
      });
    }
  };

  const debouncedCheckReferral = debounce(checkReferralId, 500);

  const handleSendOtp = async () => {
    setErrors({});
    setIsLoading(true);

    // Validation checks with scroll to first error
    let firstError = null;
    const newErrors = {};

    if (!referralStatus.isValid) {
      newErrors.referralId =
        'Please enter a valid referral ID with available slots';
      if (!firstError) firstError = 'referralId';
    }

    if (!validatePhoneNumber(phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
      if (!firstError) firstError = 'phone';
    }

    if (!city.trim()) {
      newErrors.city = 'City is required';
      if (!firstError) firstError = 'city';
    }

    if (!state) {
      newErrors.state = 'Please select a state';
      if (!firstError) firstError = 'state';
    }

    if (!referralId.trim()) {
      newErrors.referralId = 'Referral ID is required';
      if (!firstError) firstError = 'referralId';
    }

    const passwordErrors = validatePassword(password);

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      if (!firstError) firstError = 'confirmPassword';
    }

    if (passwordErrors.length > 0) {
      newErrors.password = passwordErrors;
      if (!firstError) firstError = 'password';
    }

    // If there are errors, set them and scroll to first error
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      if (firstError) {
        scrollToError(firstError);
      }
      return;
    }

    try {
      const checkPhoneResponse = await axios.post(
        `${API_BASE_URL}/check-phone`,
        {
          phoneNo: phone,
        },
      );

      if (!checkPhoneResponse.data.success) {
        const phoneError = 'Phone number already registered. Please log in.';
        setErrors({ phone: phoneError });
        setIsLoading(false);
        scrollToError('phone');
        return;
      }

      const sendOtpResponse = await axios.post(`${API_BASE_URL}/send-otp`, {
        phoneNo: phone,
      });

      if (sendOtpResponse.data.success) {
        setOtpSent(true);
        Alert.alert('Success', 'OTP sent successfully!');
        // Store debug OTP for testing (remove this in production)
        // await AsyncStorage.setItem('debug_otp', sendOtpResponse.data.debug.otp);
      } else {
        Alert.alert('Error', 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setOtpTimer(60);
    setCanResendOtp(false);

    try {
      const sendOtpResponse = await axios.post(`${API_BASE_URL}/send-otp`, {
        phoneNo: phone,
      });

      if (sendOtpResponse.data.success) {
        // await AsyncStorage.setItem('debug_otp', sendOtpResponse.data.debug.otp);
        setOtpSent(true);
      } else {
        const apiError = 'Failed to resend OTP. Please try again.';
        setErrors({ api: apiError });
        scrollToError('api');
      }
    } catch (error) {
      console.error('Error:', error);
      const apiError =
        error.response?.data?.message || 'An error occurred. Please try again.';
      setErrors({ api: apiError });
      scrollToError('api');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    setIsLoading(true);

    if (otp.length !== 6) {
      const otpError = 'Please enter a valid 6-digit OTP';
      setErrors({ otp: otpError });
      setIsLoading(false);
      scrollToError('otp');
      return;
    }

    try {
      if (!city || !state) {
        const cityStateError = 'City and State are required';
        setErrors({ cityState: cityStateError });
        setIsLoading(false);
        scrollToError('city');
        return;
      }

      const signupData = {
        name: displayName,
        phoneNo: phone,
        email,
        password,
        city,
        state,
        referralId,
      };

      // Save data to AsyncStorage
      await AsyncStorage.setItem('signupData', JSON.stringify(signupData));
      await AsyncStorage.removeItem('debug_otp');

      // Navigate to next step - Add error handling for navigation
      if (navigation) {
        navigation.navigate('UserKyc');
      } else {
        console.error('Navigation object not available');
        Alert.alert('Error', 'Navigation not available. Please try again.');
      }
    } catch (error) {
      console.error('Error saving user data locally:', error);
      const saveError = 'Failed to save user data. Try again later.';
      setErrors({ api: saveError });
      scrollToError('api');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPasswordRequirements = () => (
    <View style={styles.passwordRequirements}>
      <Text style={styles.passwordRequirementsTitle}>
        Password Requirements:
      </Text>
      <View style={styles.requirementsList}>
        <View style={styles.requirementItem}>
          <View
            style={[
              styles.requirementIcon,
              passwordRequirements.minLength && styles.requirementMet,
            ]}
          >
            <Text
              style={[
                {
                  color: passwordRequirements.minLength
                    ? '#fff'
                    : 'rgba(236, 240, 241, 0.7)',
                },
                passwordRequirements.minLength && styles.requirementIconText,
              ]}
            >
              {passwordRequirements.minLength ? '✓' : '○'}
            </Text>
          </View>
          <Text
            style={[
              styles.requirementText,
              passwordRequirements.minLength && styles.requirementMetText,
            ]}
          >
            At least 8 characters long
          </Text>
        </View>
        <View style={styles.requirementItem}>
          <View
            style={[
              styles.requirementIcon,
              passwordRequirements.hasNumber && styles.requirementMet,
            ]}
          >
            <Text
              style={[
                {
                  color: passwordRequirements.hasNumber
                    ? '#fff'
                    : 'rgba(236, 240, 241, 0.7)',
                },
                passwordRequirements.hasNumber && styles.requirementIconText,
              ]}
            >
              {passwordRequirements.hasNumber ? '✓' : '○'}
            </Text>
          </View>
          <Text
            style={[
              styles.requirementText,
              passwordRequirements.hasNumber && styles.requirementMetText,
            ]}
          >
            At least one number
          </Text>
        </View>
        <View style={styles.requirementItem}>
          <View
            style={[
              styles.requirementIcon,
              passwordRequirements.hasSpecialChar && styles.requirementMet,
            ]}
          >
            <Text
              style={[
                {
                  color: passwordRequirements.hasSpecialChar
                    ? '#fff'
                    : 'rgba(236, 240, 241, 0.7)',
                },
                passwordRequirements.hasSpecialChar &&
                  styles.requirementIconText,
              ]}
            >
              {passwordRequirements.hasSpecialChar ? '✓' : '○'}
            </Text>
          </View>
          <Text
            style={[
              styles.requirementText,
              passwordRequirements.hasSpecialChar && styles.requirementMetText,
            ]}
          >
            At least one special character
          </Text>
        </View>
      </View>
    </View>
  );

  // Add fallback navigation handlers
  const handleLoginNavigation = () => {
    if (navigation) {
      navigation.navigate('Login');
    } else {
      console.error('Navigation not available');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>
              Join us and start your journey today
            </Text>
            <Text style={styles.brandName}>NAPHEX</Text>
          </View>

          <View style={styles.cardBody}>
            {errors.api && (
              <View style={[styles.alert, styles.alertError]}>
                <Text>⚠</Text>
                <Text style={styles.alertText}>{errors.api}</Text>
              </View>
            )}

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Personal Information</Text>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Full Name</Text>
                <TextInput
                  style={[styles.formControl, otpSent && styles.disabledInput]}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Enter name as per Aadhaar card"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  editable={!otpSent}
                />
              </View>

              <View style={styles.formGroup} ref={emailInputRef}>
                <Text style={styles.formLabel}>Email Address (Optional)</Text>
                <TextInput
                  style={[styles.formControl, otpSent && styles.disabledInput]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email address"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  keyboardType="email-address"
                  editable={!otpSent}
                />
              </View>

              <View style={styles.formGroup} ref={phoneInputRef}>
                <Text style={styles.formLabel}>Phone Number</Text>
                <TextInput
                  style={[
                    styles.formControl,
                    otpSent && styles.disabledInput,
                    errors.phone && styles.errorInput,
                  ]}
                  value={phone}
                  onChangeText={text => setPhone(text.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit phone number"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  keyboardType="phone-pad"
                  maxLength={10}
                  editable={!otpSent}
                />
                {errors.phone && (
                  <Text style={styles.errorMessage}>⚠ {errors.phone}</Text>
                )}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Location Details</Text>

              <View style={styles.twoColumn}>
                <View
                  style={[styles.formGroup, styles.columnItem]}
                  ref={cityInputRef}
                >
                  <Text style={styles.formLabel}>City</Text>
                  <TextInput
                    style={[
                      styles.formControl,
                      otpSent && styles.disabledInput,
                      errors.city && styles.errorInput,
                    ]}
                    value={city}
                    onChangeText={setCity}
                    placeholder="Enter your city"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    editable={!otpSent}
                  />
                  {errors.city && (
                    <Text style={styles.errorMessage}>⚠ {errors.city}</Text>
                  )}
                </View>

                <View
                  style={[styles.formGroup, styles.columnItem]}
                  ref={stateInputRef}
                >
                  <Text style={styles.formLabel}>State</Text>
                  <View
                    style={[
                      styles.pickerContainer,
                      otpSent && styles.pickerDisabled,
                      errors.state && styles.errorInput,
                    ]}
                  >
                    <Picker
                      selectedValue={state}
                      onValueChange={itemValue => setState(itemValue)}
                      enabled={!otpSent}
                      style={styles.picker}
                    >
                      <Picker.Item label="Select State" value="" />
                      {INDIAN_STATES.map((stateName, index) => (
                        <Picker.Item
                          key={index}
                          label={stateName}
                          value={stateName}
                        />
                      ))}
                    </Picker>
                  </View>
                  {errors.state && (
                    <Text style={styles.errorMessage}>⚠ {errors.state}</Text>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Account Security</Text>

              <View style={styles.formGroup} ref={passwordInputRef}>
                <Text style={styles.formLabel}>Password</Text>
                <View
                  style={[styles.passwordContainer, { position: 'relative' }]}
                >
                  <TextInput
                    style={[
                      styles.formControl,
                      otpSent && styles.disabledInput,
                      errors.password && styles.errorInput,
                      { paddingRight: 50 }, // Add padding for the icon
                    ]}
                    value={password}
                    onChangeText={handlePasswordChange}
                    placeholder="Create a strong password"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    secureTextEntry={!showPassword}
                    editable={!otpSent}
                  />
                  <TouchableOpacity
                    style={{
                      position: 'absolute',
                      right: 15,
                      top: '50%',
                      transform: [{ translateY: -10 }],
                      padding: 5,
                    }}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={otpSent}
                  >
                    <EyeIcon
                      visible={showPassword}
                      color={
                        otpSent
                          ? 'rgba(255, 255, 255, 0.3)'
                          : 'rgba(255, 255, 255, 0.7)'
                      }
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && Array.isArray(errors.password) && (
                  <View style={styles.errorContainer}>
                    {errors.password.map((error, index) => (
                      <Text key={index} style={styles.errorMessage}>
                        ⚠ {error}
                      </Text>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.formGroup} ref={confirmPasswordInputRef}>
                <Text style={styles.formLabel}>Confirm Password</Text>
                <View
                  style={[styles.passwordContainer, { position: 'relative' }]}
                >
                  <TextInput
                    style={[
                      styles.formControl,
                      otpSent && styles.disabledInput,
                      errors.confirmPassword && styles.errorInput,
                      { paddingRight: 50 }, // Add padding for the icon
                    ]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Re-enter your password"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    secureTextEntry={!showConfirmPassword}
                    editable={!otpSent}
                  />
                  <TouchableOpacity
                    style={{
                      position: 'absolute',
                      right: 15,
                      top: '50%',
                      transform: [{ translateY: -10 }],
                      padding: 5,
                    }}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={otpSent}
                  >
                    <EyeIcon
                      visible={showConfirmPassword}
                      color={
                        otpSent
                          ? 'rgba(255, 255, 255, 0.3)'
                          : 'rgba(255, 255, 255, 0.7)'
                      }
                    />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && (
                  <Text style={styles.errorMessage}>
                    ⚠ {errors.confirmPassword}
                  </Text>
                )}
              </View>

              {renderPasswordRequirements()}
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Referral Information</Text>

              <View style={styles.formGroup} ref={referralInputRef}>
                <Text style={styles.formLabel}>Referral ID</Text>
                <TextInput
                  style={[
                    styles.formControl,
                    otpSent && styles.disabledInput,
                    errors.referralId && styles.errorInput,
                    referralStatus.isValid && styles.validInput,
                  ]}
                  value={referralId}
                  onChangeText={text => {
                    setReferralId(text);
                    debouncedCheckReferral(text);
                  }}
                  placeholder="Enter referral ID"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  editable={!otpSent}
                />
                {referralStatus.isChecking && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#4CAF50" />
                    <Text style={styles.loadingText}>
                      Checking referral ID...
                    </Text>
                  </View>
                )}
                {referralStatus.message && !referralStatus.isChecking && (
                  <View>
                    <Text
                      style={[
                        styles.referralMessage,
                        referralStatus.isValid
                          ? styles.validMessage
                          : styles.errorMessage,
                      ]}
                    >
                      {referralStatus.isValid ? '✓' : '⚠'}{' '}
                      {referralStatus.message}
                    </Text>
                    {referralStatus.slotsAvailable && (
                      <Text style={styles.slotsAvailableText}>
                        {referralStatus.slotsAvailable === 'both'
                          ? 'Both slots are available'
                          : 'Right slot is available'}
                      </Text>
                    )}
                  </View>
                )}
                {errors.referralId && (
                  <Text style={styles.errorMessage}>⚠ {errors.referralId}</Text>
                )}
              </View>
            </View>

            {otpSent && (
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>OTP Verification</Text>

                <View style={styles.formGroup} ref={otpInputRef}>
                  <Text style={styles.formLabel}>Enter OTP</Text>
                  <TextInput
                    style={[
                      styles.formControl,
                      styles.otpInput,
                      errors.otp && styles.errorInput,
                    ]}
                    value={otp}
                    onChangeText={text => setOtp(text.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  {errors.otp && (
                    <Text style={styles.errorMessage}>⚠ {errors.otp}</Text>
                  )}
                </View>

                <View style={styles.otpActions}>
                  {otpTimer > 0 ? (
                    <Text style={styles.timerText}>
                      Resend OTP in {otpTimer} seconds
                    </Text>
                  ) : (
                    <TouchableOpacity
                      style={styles.resendButton}
                      onPress={handleResendOtp}
                      disabled={isLoading}
                    >
                      <Text style={styles.resendButtonText}>Resend OTP</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            <View style={styles.formActions}>
              {!otpSent ? (
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    isLoading && styles.disabledButton,
                  ]}
                  onPress={handleSendOtp}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Send OTP</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    isLoading && styles.disabledButton,
                  ]}
                  onPress={handleNext}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Continue</Text>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleLoginNavigation}
              >
                <Text style={styles.secondaryButtonText}>
                  Already have an account? LogIn
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignupPage;
