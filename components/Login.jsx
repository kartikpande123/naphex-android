import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  StatusBar,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import styles from './LoginStyles';
import API_BASE_URL from './ApiConfig';
import logo from '../images/logo-2.jpg';

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

const HelpIcon = ({ color = '#666', size = 14 }) => (
  <View
    style={{
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    }}
  >
    {/* Outer Circle */}
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Question Mark */}
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: -1,
        }}
      >
        {/* Top curve of question mark */}
        <View
          style={{
            width: size * 0.35,
            height: size * 0.35,
            borderTopWidth: 2,
            borderRightWidth: 2,
            borderColor: color,
            borderTopRightRadius: size * 0.25,
            marginBottom: 1,
          }}
        />
        {/* Vertical line */}
        <View
          style={{
            width: 2,
            height: size * 0.15,
            backgroundColor: color,
            marginBottom: 2,
          }}
        />
        {/* Dot */}
        <View
          style={{
            width: 2,
            height: 2,
            borderRadius: 1,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  </View>
);

const Login = () => {
  const [phoneNo, setPhoneNo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const navigation = useNavigation();

  const validateInputs = () => {
    setError('');

    if (!/^\d{10}$/.test(phoneNo)) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (failedAttempts >= 10) {
      setError(
        'You have exceeded the maximum number of login attempts. Please reset your password.',
      );
      navigation.navigate('ForgotPassword');
      return;
    }

    if (!validateInputs()) return;

    setLoading(true);
    setError('');

    try {
      // Step 1: Pre-check password
      const testResponse = await fetch(`${API_BASE_URL}/test-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNo, password }),
      });

      const testData = await testResponse.json();

      if (!testResponse.ok || !testData.success || !testData.passwordMatches) {
        setFailedAttempts(prev => prev + 1);
        setError(
          `Invalid phone number or password. Attempts remaining: ${
            10 - (failedAttempts + 1)
          }`,
        );
        setLoading(false);
        return;
      }

      // Step 2: Proceed to full login
      const loginResponse = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNo, password }),
      });

      const loginText = await loginResponse.text();
      let loginData = {};

      try {
        loginData = JSON.parse(loginText);
      } catch {
        // ignore JSON parse errors
      }

      if (!loginResponse.ok) {
        if (loginResponse.status === 403) {
          if (loginText.toLowerCase().includes('blocked')) {
            setError('Your account is blocked. Please contact help.');
          } else {
            setError(loginText);
          }
          setLoading(false);
          return;
        }

        if (loginResponse.status === 401) {
          setError(
            'Invalid credentials. Please check your phone number or password.',
          );
          setLoading(false);
          return;
        }

        throw new Error(
          `Login Failed: ${loginText || loginResponse.statusText}`,
        );
      }

      // Step 3: Login success
      if (loginData.success) {
        setFailedAttempts(0);
        await AsyncStorage.setItem('authToken', loginData.customToken);

        const userDataWithTimestamp = {
          ...loginData.userData,
          loginTimestamp: new Date().toISOString(),
          userids: {
            myuserid: loginData.userData.userids?.myuserid || '',
            myrefrelid: loginData.userData.userids?.myrefrelid || '',
          },
        };

        await AsyncStorage.setItem(
          'userData',
          JSON.stringify(userDataWithTimestamp),
        );
        setPhoneNo('');
        setPassword('');

        navigation.navigate('Home', {
          welcomeMessage: `Welcome back, ${loginData.userData.name}!`,
        });
      } else {
        setError(
          loginData.message || 'Login failed. Please verify your credentials.',
        );
      }
    } catch (error) {
      console.error('Login process error:', error);

      if (error.message.includes('Network')) {
        setError('Network error. Please check your internet connection.');
      } else if (error.message.includes('Failed')) {
        setError(error.message);
      } else {
        setError('User not found. Please sign up and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const goToHelp = () => {
    navigation.navigate('Help');
  };

  const handlePhoneNoChange = value => {
    const numericValue = value.replace(/\D/g, '').slice(0, 10);
    setPhoneNo(numericValue);
  };

  const navigateToPage = pageName => {
    navigation.navigate(pageName);
  };

  const QuickLinksComponent = ({ isMobile = false }) => (
    <View style={[styles.linksContainer, isMobile && styles.mobileLinks]}>
      <Text style={styles.linksHeader}>Quick Links</Text>

      <View style={styles.navLinks}>
        <TouchableOpacity
          style={[styles.navLink, styles.navLinkStatus]}
          onPress={() => navigateToPage('StatusCheck')}
        >
          <Text style={styles.linkIcon}>📊</Text>
          <Text style={styles.linkText}>Check account status</Text>
          <Text style={styles.linkArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navLink, styles.navLinkStatus]}
          onPress={() => Linking.openURL('https://www.naphex.com/howtoplay')}
        >
          <Text style={styles.linkIcon}>📽️</Text>
          <Text style={styles.linkText}>How To Play</Text>
          <Text style={styles.linkArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navLink, styles.navLinkTerms]}
          onPress={() => navigateToPage('TermsAndConditions')}
        >
          <Text style={styles.linkIcon}>📋</Text>
          <Text style={styles.linkText}>Terms & Conditions</Text>
          <Text style={styles.linkArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navLink, styles.navLinkKyc]}
          onPress={() => navigateToPage('KycPolicy')}
        >
          <Text style={styles.linkIcon}>🔒</Text>
          <Text style={styles.linkText}>KYC Policy</Text>
          <Text style={styles.linkArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navLink, styles.navLinkPrivacy]}
          onPress={() => navigateToPage('PrivacyPolicy')}
        >
          <Text style={styles.linkIcon}>🛡️</Text>
          <Text style={styles.linkText}>Privacy Policy</Text>
          <Text style={styles.linkArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navLink, styles.navLinkAbout]}
          onPress={() => navigateToPage('About')}
        >
          <Text style={styles.linkIcon}>ℹ️</Text>
          <Text style={styles.linkText}>About Us</Text>
          <Text style={styles.linkArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#42a5f5" barStyle="light-content" />

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.companyLogo}>
            <Image
              source={logo}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Form Section */}
          <View style={styles.formSection}>
            <View style={styles.loginCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.headerTitle}>Welcome Back</Text>
                <Text style={styles.headerSubtitle}>
                  NADAKATTI ENTERPRISES PRESENTS NAPHEX
                </Text>
              </View>

              <View style={styles.cardBody}>
                {error !== '' && (
                  <View style={styles.alert}>
                    <Text style={styles.alertText}>{error}</Text>
                  </View>
                )}

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.formControl}
                    placeholder="Enter your 10-digit phone number"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    value={phoneNo}
                    onChangeText={handlePhoneNoChange}
                    keyboardType="numeric"
                    maxLength={10}
                    editable={!loading}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={[styles.formControl, styles.passwordInput]}
                      placeholder="Enter your password"
                      placeholderTextColor="rgba(255, 255, 255, 0.7)"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      style={styles.passwordToggle}
                      onPress={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      <EyeIcon
                        visible={showPassword}
                        color="rgba(255, 255, 255, 0.8)"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.btnPrimary, loading && styles.btnDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading && (
                    <ActivityIndicator
                      size="small"
                      color="#ffffff"
                      style={styles.spinner}
                    />
                  )}
                  <Text style={styles.btnText}>
                    {loading ? 'Logging In...' : 'Log In'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.forgotPasswordLink}
                  onPress={() => navigation.navigate('ForgotPassword')}
                >
                  <Text style={styles.forgotPasswordText}>
                    Forgot your password?
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.cardFooterText}>
                  Don't have an account?{' '}
                  <Text
                    style={styles.signupLink}
                    onPress={() => navigation.navigate('Signup')}
                  >
                    Sign up here
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Mobile Quick Links */}
        <QuickLinksComponent isMobile={true} />
      </ScrollView>

      {/* Help Button */}
      <TouchableOpacity style={styles.helpButton} onPress={goToHelp}>
        <HelpIcon color="#ffffff" size={18} />
        <Text style={styles.helpButtonText}>Help</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Login;
