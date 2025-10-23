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
  Linking,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from './ApiConfig';

const { width, height } = Dimensions.get('window');

const AddTokens = ({ navigation, onTokensUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [phone, setPhone] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [userTokens, setUserTokens] = useState(0);
  const [showPaymentIdInput, setShowPaymentIdInput] = useState(false);
  const [paymentId, setPaymentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Token price (₹1 per token)
  const TOKEN_PRICE = 1;
  const GST_RATE = 0.28; // 28% GST
  const PAYMENT_GATEWAY_FEE = 0.025; // 2.5% Razorpay fee

  // Payment link - Razorpay payment link
  const RAZORPAY_PAYMENT_LINK = "https://razorpay.me/@mohammedadilbetageri?amount=tEDHZxxCtz0rKFL9kTzhOw%3D%3D";

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
    AsyncStorage.getItem('userData').then(d => {
      if (d) {
        const user = JSON.parse(d);
        setPhone(user.phoneNo || '');
        setUserTokens(user.tokens || 0);
      }
    });
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

  const calculatePaymentGatewayFee = () => {
    const tokens = parseInt(tokenAmount);
    if (!tokens) return 0;
    const amount = tokens * TOKEN_PRICE;
    return parseFloat((amount * PAYMENT_GATEWAY_FEE).toFixed(2));
  };

  const calculateNetTokens = () => {
    const tokens = parseInt(tokenAmount);
    if (!tokens) return 0;
    // Net tokens = Total - GST - Gateway Fee
    const gst = calculateGST();
    const gatewayFee = calculatePaymentGatewayFee();
    return parseFloat((tokens - gst - gatewayFee).toFixed(2));
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

    // Open Razorpay payment link
    Linking.openURL(RAZORPAY_PAYMENT_LINK).catch(err => {
      console.error('Error opening payment link:', err);
      showToast("Failed to open payment link", "error");
    });
    
    // Show payment ID input after opening payment link
    setShowPaymentIdInput(true);
    setStatus('Please complete the payment and copy your Payment ID from Razorpay');
  };

  const handleSubmitPaymentId = async () => {
    if (!paymentId.trim()) {
      showToast("Please enter the Payment ID", "error");
      return;
    }

    if (!phone) {
      showToast("Phone number not found", "error");
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
      const res = await fetch(`${API_BASE_URL}/submit-token-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phoneNo: phone, 
          paymentId: paymentId.trim(),
          requestedTokens: tokens,
          netTokens: calculateNetTokens(),
          amountPaid: calculateTotalAmount(),
          gstAmount: calculateGST(),
          gatewayFee: calculatePaymentGatewayFee()
        })
      });

      const data = await res.json();
      
      if (data.success) {
        // Show success toast with detailed info
        showToast(
          `Token Request Submitted! Your payment is under verification. Admin will add ${calculateNetTokens().toLocaleString()} tokens to your account within 24-48 hours. Payment ID: ${paymentId.trim()}`,
          "success",
          8000
        );
        
        setShowPaymentIdInput(false);
        setTokenAmount('');
        setPaymentId('');
        setStatus('');

        // Navigate back after short delay
        setTimeout(() => {
          if (navigation) {
            navigation.goBack();
          }
        }, 1000);
      } else {
        throw new Error(data.error || 'Failed to submit token request');
      }
    } catch (err) {
      console.error("Error submitting payment ID:", err);
      showToast(err.message, "error");
      setStatus('');
    } finally {
      setIsSubmitting(false);
    }
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

          {!showPaymentIdInput ? (
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

                    <View style={styles.breakdownRow}>
                      <Text style={[styles.breakdownLabel, styles.deductionLabel]}>- Gateway Fee (2.5%)</Text>
                      <Text style={[styles.breakdownValue, styles.deductionValue]}>-₹{calculatePaymentGatewayFee().toLocaleString()}</Text>
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
                  • Keep your Payment ID safe for reference{'\n'}
                  • 28% GST + 2.5% gateway fee will be deducted from recharge amount{'\n'}
                  • Example: ₹100 recharge = ₹100 - ₹28 (GST) - ₹2.5 (fee) = ~69.5 tokens{'\n'}
                  • No maximum limit - you can purchase any amount of tokens
                </Text>
              </View>

              {/* Status Display */}
              {status ? (
                <View style={[
                  styles.statusContainer,
                  status.includes('Error') || status.includes('failed') ? styles.errorContainer : {}
                ]}>
                  <Text style={[
                    styles.statusText,
                    status.includes('Error') || status.includes('failed') ? styles.errorText : {}
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
            // Payment ID Input Section
            <>
              {/* Warning Message */}
              <View style={styles.warningContainer}>
                <Text style={styles.warningTitle}>⚠️ Important:</Text>
                <Text style={styles.warningText}>
                  After completing payment on Razorpay, copy the <Text style={styles.boldText}>Payment ID</Text> and paste it below.
                </Text>
              </View>

              {/* Payment ID Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  Enter Payment ID <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={paymentId}
                  onChangeText={setPaymentId}
                  placeholder="e.g., pay_ABC123xyz"
                  editable={!isSubmitting}
                />
              </View>

              {/* Summary */}
              <View style={styles.summaryContainer}>
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

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!paymentId.trim() || isSubmitting) && styles.disabledButton
                ]}
                onPress={handleSubmitPaymentId}
                disabled={!paymentId.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={styles.buttonText}>Submitting...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>✅ Submit Payment ID</Text>
                )}
              </TouchableOpacity>

              {/* Back Button */}
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setShowPaymentIdInput(false);
                  setPaymentId('');
                  setStatus('');
                }}
              >
                <Text style={styles.secondaryButtonText}>← Back to Token Selection</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Security Info */}
          <View style={styles.securityContainer}>
            <Text style={styles.securityIcon}>🔒</Text>
            <Text style={styles.securityText}>
              <Text style={styles.securityBold}>Secure Payment</Text> powered by Razorpay
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
  boldText: {
    fontWeight: '700',
  },
  summaryContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  statusText: {
    fontSize: 13,
    color: '#1e40af',
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