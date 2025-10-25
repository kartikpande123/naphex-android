import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  TextInput,
  ScrollView,
  SafeAreaView,
  Image,
  Clipboard,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import API_BASE_URL from './ApiConfig';

const { width, height } = Dimensions.get('window');

// Import your QR code image - make sure to add this image to your React Native assets
const upiQrCode = require('../images/upi_bar.jpg'); // Adjust path as needed

const AddTokens = ({ navigation, onTokensUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [phone, setPhone] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [userTokens, setUserTokens] = useState(0);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Token price (₹1 per token)
  const TOKEN_PRICE = 1;
  const GST_RATE = 0.28; // 28% GST only
  const UPI_ID = "9019842426-2@ybl";

  // Toast notification function
  const showToast = (message, type = 'success', duration = 5000) => {
    const id = Date.now();
    const toast = { id, message, type };
    setToasts(prev => [...prev, toast]);

    // Auto remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) {
          const user = JSON.parse(storedUserData);
          setPhone(user.phoneNo || '');
          setUserTokens(user.tokens || 0);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    fetchUserData();
  }, []);

  const handleTokenAmountChange = (value) => {
    // Only allow positive integers
    if (value === '' || (/^\d+$/.test(value) && parseInt(value) > 0)) {
      setTokenAmount(value);
      setStatus('');
    }
  };

  const calculateGST = () => {
    const tokens = parseInt(tokenAmount);
    if (!tokens) return 0;
    return parseFloat((tokens * GST_RATE).toFixed(2));
  };

  const calculateNetTokens = () => {
    const tokens = parseInt(tokenAmount);
    if (!tokens) return 0;
    // Net tokens = Total - GST (28% only)
    const gst = calculateGST();
    return parseFloat((tokens - gst).toFixed(2));
  };

  const calculateTotalAmount = () => {
    // User wants to recharge for X tokens
    // They need to pay X amount (₹1 per token)
    const tokens = parseInt(tokenAmount);
    if (!tokens) return 0;
    return tokens * TOKEN_PRICE;
  };

  const handlePayNow = () => {
    const tokens = parseInt(tokenAmount);
    
    if (!tokens || tokens < 1) {
      showToast("Please enter a valid token amount (minimum 1)", "error");
      return;
    }

    if (!phone) {
      showToast("Phone number not found", "error");
      return;
    }

    // Show payment form with QR code
    setShowPaymentForm(true);
    setStatus('Scan the QR code or use the UPI ID to make payment');
  };

  const copyToClipboard = async () => {
    await Clipboard.setString(UPI_ID);
    showToast("✅ UPI ID copied to clipboard!", "success");
  };

  const pickImage = async () => {
    try {
      const options = {
        mediaType: 'photo',
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8,
        includeBase64: false,
      };

      launchImageLibrary(options, (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.error) {
          console.log('ImagePicker Error: ', response.error);
          showToast("❌ Error selecting image", "error");
        } else if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          
          // Check file size (rough estimation)
          if (asset.fileSize > 5 * 1024 * 1024) {
            showToast("❌ File size should be less than 5MB", "error");
            return;
          }

          setPaymentScreenshot(asset);
          setScreenshotPreview(asset.uri);
        }
      });
    } catch (error) {
      console.error('Error picking image:', error);
      showToast("❌ Error selecting image", "error");
    }
  };

  const handleSubmitPayment = async () => {
    if (!paymentScreenshot) {
      showToast("❌ Please upload payment screenshot", "error");
      return;
    }

    if (!phone) {
      showToast("❌ Phone number not found", "error");
      return;
    }

    const tokens = parseInt(tokenAmount);
    if (!tokens) {
      showToast("Invalid token amount", "error");
      return;
    }

    setIsSubmitting(true);
    setStatus('Submitting token request for verification...');

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('phoneNo', phone);
      formData.append('transactionId', transactionId.trim() || 'N/A');
      formData.append('requestedTokens', tokens.toString());
      formData.append('netTokens', calculateNetTokens().toString());
      formData.append('amountPaid', calculateTotalAmount().toString());
      formData.append('gstAmount', calculateGST().toString());
      
      // Append the image file for react-native-image-picker
      formData.append('screenshot', {
        uri: paymentScreenshot.uri,
        type: paymentScreenshot.type || 'image/jpeg',
        name: paymentScreenshot.fileName || `payment_screenshot_${Date.now()}.jpg`,
      });

      const res = await fetch(`${API_BASE_URL}/submit-token-request`, {
        method: "POST",
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await res.json();
      
      if (data.success) {
        // Show success toast with detailed info
        showToast(
          `Token Request Submitted Successfully! Admin team will update tokens within 4 to 24 hours. Please check request status in previous requests page.`,
          "success",
          8000
        );
        
        // Clear form and navigate back
        setShowPaymentForm(false);
        setTokenAmount('');
        setTransactionId('');
        setPaymentScreenshot(null);
        setScreenshotPreview('');
        setStatus('');

        // Navigate back after short delay
        setTimeout(() => {
          if (navigation) {
            navigation.goBack();
          }
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to submit token request');
      }
    } catch (err) {
      console.error("Error submitting payment:", err);
      showToast(`❌ Error: ${err.message}`, "error");
      setStatus('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearPaymentForm = () => {
    setShowPaymentForm(false);
    setTransactionId('');
    setPaymentScreenshot(null);
    setScreenshotPreview('');
    setStatus('');
  };

  const handleGoBack = () => {
    if (navigation) {
      navigation.goBack();
    }
  };

  const handleViewPreviousRequests = () => {
    if (navigation) {
      navigation.navigate('UserTokenRequest');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          disabled={loading}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Tokens</Text>
        <TouchableOpacity
          style={styles.requestsButton}
          onPress={handleViewPreviousRequests}
          disabled={loading}
        >
          <Text style={styles.requestsButtonText}>Previous{'\n'}Requests</Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.body}>
          
          {/* Token Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.tokenIcon}>🪙</Text>
          </View>
          
          {/* Current Balance */}
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceAmount}>
              {userTokens.toLocaleString()} tokens
            </Text>
          </View>

          {!showPaymentForm ? (
            <>
              {/* Token Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Enter Token Amount to Purchase</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={tokenAmount}
                    onChangeText={handleTokenAmountChange}
                    placeholder="e.g., 100"
                    keyboardType="numeric"
                    editable={!loading}
                    placeholderTextColor="#9ca3af"
                  />
                  <Text style={styles.inputSuffix}>tokens</Text>
                </View>
              </View>

              {/* Price Breakdown */}
              {tokenAmount && !isNaN(parseInt(tokenAmount)) && (
                <>
                  {/* Total Amount Display */}
                  <View style={styles.totalAmountContainer}>
                    <Text style={styles.totalAmountLabel}>Total Amount to Pay</Text>
                    <Text style={styles.totalAmountValue}>
                      ₹{calculateTotalAmount().toLocaleString()}
                    </Text>
                    <Text style={styles.totalAmountNote}>
                      for {parseInt(tokenAmount).toLocaleString()} tokens recharge
                    </Text>
                  </View>

                  {/* Breakdown Details */}
                  <View style={styles.breakdownContainer}>
                    <Text style={styles.breakdownTitle}>💰 Breakdown (from ₹{calculateTotalAmount().toLocaleString()})</Text>
                    
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Base Recharge</Text>
                      <Text style={styles.breakdownValue}>₹{calculateTotalAmount().toLocaleString()}</Text>
                    </View>

                    <View style={styles.breakdownRow}>
                      <Text style={[styles.breakdownLabel, styles.deductionLabel]}>- GST (28%)</Text>
                      <Text style={[styles.breakdownValue, styles.deductionValue]}>-₹{calculateGST().toLocaleString()}</Text>
                    </View>

                    <View style={styles.breakdownDivider} />

                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownFinalLabel}>You Will Get</Text>
                      <Text style={styles.breakdownFinalValue}>{calculateNetTokens().toLocaleString()} tokens</Text>
                    </View>
                  </View>
                </>
              )}

              {/* Important Information */}
              <View style={styles.infoContainer}>
                <Text style={styles.infoTitle}>📋 Important Information</Text>
                <Text style={styles.infoText}>
                  • Payment will be verified by admin within 4-24 hours{'\n'}
                  • You will receive tokens after successful verification{'\n'}
                  • Keep your transaction details safe for reference{'\n'}
                  • 28% GST will be deducted from recharge amount{'\n'}
                  • Example: ₹100 recharge = ₹100 - ₹28 (GST) = 72 tokens{'\n'}
                  • No maximum limit - you can purchase any amount of tokens
                </Text>
              </View>

              {/* Status Display */}
              {status ? (
                <View style={[
                  styles.statusContainer,
                  status.includes('Error') || status.includes('failed') ? styles.errorContainer : styles.successContainer
                ]}>
                  <Text style={[
                    styles.statusText,
                    status.includes('Error') || status.includes('failed') ? styles.errorText : styles.successText
                  ]}>
                    {status}
                  </Text>
                </View>
              ) : null}

              {/* Payment Button */}
              <TouchableOpacity
                style={[
                  styles.paymentButton,
                  (!tokenAmount || !parseInt(tokenAmount) || loading) && styles.disabledButton
                ]}
                onPress={handlePayNow}
                disabled={!tokenAmount || !parseInt(tokenAmount) || loading}
              >
                <Text style={styles.buttonText}>
                  {tokenAmount && parseInt(tokenAmount) > 0 ? 
                    `💳 Pay ₹${calculateTotalAmount().toLocaleString()}` : 
                    'Enter Amount'
                  }
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            // Payment Form Section (QR Code + Screenshot Upload)
            <>
              {/* QR Code Section */}
              <View style={styles.qrContainer}>
                <Text style={styles.qrTitle}>Scan QR Code to Pay</Text>
                <View style={styles.qrImageContainer}>
                  <Image 
                    source={upiQrCode} 
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                </View>
                
                <View style={styles.upiContainer}>
                  <Text style={styles.upiLabel}>Or use UPI ID:</Text>
                  <View style={styles.upiRow}>
                    <Text style={styles.upiId}>{UPI_ID}</Text>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={copyToClipboard}
                    >
                      <Text style={styles.copyButtonText}>📋 Copy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Warning Message */}
              <View style={styles.warningContainer}>
                <Text style={styles.warningTitle}>⚠️ Important:</Text>
                <Text style={styles.warningText}>
                  After completing payment, upload the screenshot below and optionally provide transaction ID.
                </Text>
              </View>

              {/* Transaction ID - Optional */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  Transaction ID <Text style={styles.optionalText}>(Optional)</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={transactionId}
                  onChangeText={setTransactionId}
                  placeholder="e.g., TXN123456789"
                  editable={!isSubmitting}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Payment Screenshot - Required */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  Payment Screenshot <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={pickImage}
                  disabled={isSubmitting}
                >
                  <Text style={styles.uploadButtonText}>
                    📸 Choose Screenshot
                  </Text>
                </TouchableOpacity>
                <Text style={styles.uploadNote}>Max size: 5MB | Formats: JPG, PNG, JPEG</Text>
              </View>

              {/* Screenshot Preview */}
              {screenshotPreview && (
                <View style={styles.previewContainer}>
                  <Image 
                    source={{ uri: screenshotPreview }} 
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.previewText}>✅ Screenshot uploaded</Text>
                </View>
              )}

              {/* Order Summary */}
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Order Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Requested Tokens:</Text>
                  <Text style={styles.summaryValue}>{parseInt(tokenAmount).toLocaleString()}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>You Will Get:</Text>
                  <Text style={styles.summaryValue}>{calculateNetTokens().toLocaleString()} tokens</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Amount Paid:</Text>
                  <Text style={styles.summaryValue}>₹{calculateTotalAmount().toLocaleString()}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>GST (28%):</Text>
                  <Text style={styles.summaryValue}>₹{calculateGST().toLocaleString()}</Text>
                </View>
              </View>

              {/* Status Display */}
              {status ? (
                <View style={[
                  styles.statusContainer,
                  status.includes('❌') ? styles.errorContainer : styles.successContainer
                ]}>
                  <Text style={[
                    styles.statusText,
                    status.includes('❌') ? styles.errorText : styles.successText
                  ]}>
                    {status}
                  </Text>
                </View>
              ) : null}

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!paymentScreenshot || isSubmitting) && styles.disabledButton
                ]}
                onPress={handleSubmitPayment}
                disabled={!paymentScreenshot || isSubmitting}
              >
                {isSubmitting ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={styles.buttonText}>Submitting...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>✅ Submit Payment Details</Text>
                )}
              </TouchableOpacity>

              {/* Back Button */}
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={clearPaymentForm}
              >
                <Text style={styles.secondaryButtonText}>← Back to Token Selection</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Security Info */}
          <View style={styles.securityContainer}>
            <Text style={styles.securityIcon}>🔒</Text>
            <Text style={styles.securityText}>
              <Text style={styles.securityBold}>Secure UPI Payment</Text>
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Toast Container */}
      <View style={styles.toastContainer}>
        {toasts.map((toast) => (
          <View
            key={toast.id}
            style={[
              styles.toast,
              toast.type === 'success' ? styles.toastSuccess : 
              toast.type === 'error' ? styles.toastError : styles.toastInfo
            ]}
          >
            <Text style={styles.toastIcon}>
              {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
            </Text>
            <Text style={styles.toastMessage}>{toast.message}</Text>
            <TouchableOpacity
              onPress={() => removeToast(toast.id)}
              style={styles.toastClose}
            >
              <Text style={styles.toastCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 34,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  requestsButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
  },
  requestsButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  body: {
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  tokenIcon: {
    fontSize: 48,
  },
  balanceContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  balanceLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  requiredStar: {
    color: '#dc2626',
  },
  optionalText: {
    color: '#6b7280',
    fontSize: 13,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    width: '100%',
    padding: 14,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  inputSuffix: {
    position: 'absolute',
    right: 14,
    top: 14,
    color: '#9ca3af',
    fontSize: 15,
  },
  totalAmountContainer: {
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  totalAmountLabel: {
    fontSize: 13,
    color: '#1e40af',
    marginBottom: 4,
  },
  totalAmountValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e40af',
  },
  totalAmountNote: {
    fontSize: 12,
    color: '#3b82f6',
    marginTop: 4,
  },
  breakdownContainer: {
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 13,
    color: '#065f46',
    fontWeight: '700',
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#065f46',
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065f46',
  },
  deductionLabel: {
    color: '#dc2626',
  },
  deductionValue: {
    color: '#dc2626',
  },
  breakdownDivider: {
    height: 2,
    backgroundColor: '#10b981',
    marginVertical: 8,
  },
  breakdownFinalLabel: {
    fontSize: 14,
    color: '#065f46',
    fontWeight: '700',
  },
  breakdownFinalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#065f46',
  },
  infoContainer: {
    backgroundColor: '#fffbeb',
    borderWidth: 2,
    borderColor: '#f59e0b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 18,
  },
  qrContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 12,
    textAlign: 'center',
  },
  qrImageContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  qrImage: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#007bff',
    borderRadius: 12,
  },
  upiContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    width: '100%',
  },
  upiLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  upiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  upiId: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  copyButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 4,
  },
  copyButtonText: {
    fontSize: 12,
    color: '#007bff',
  },
  warningContainer: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffc107',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#856404',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 18,
  },
  uploadButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadNote: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  previewImage: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#28a745',
    borderRadius: 8,
  },
  previewText: {
    color: '#28a745',
    fontSize: 12,
    marginTop: 8,
  },
  summaryContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065f46',
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#065f46',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 13,
    color: '#065f46',
    fontWeight: '700',
  },
  statusContainer: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 2,
  },
  statusText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#f87171',
  },
  errorText: {
    color: '#dc2626',
  },
  successContainer: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  successText: {
    color: '#065f46',
  },
  paymentButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  securityContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  securityIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#64748b',
  },
  securityBold: {
    fontWeight: '700',
  },
  toastContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    left: 20,
    zIndex: 10000,
  },
  toast: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastSuccess: {
    backgroundColor: '#10b981',
  },
  toastError: {
    backgroundColor: '#ef4444',
  },
  toastInfo: {
    backgroundColor: '#3b82f6',
  },
  toastIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  toastMessage: {
    flex: 1,
    fontSize: 13,
    color: '#ffffff',
    lineHeight: 20,
  },
  toastClose: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  toastCloseText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default AddTokens;