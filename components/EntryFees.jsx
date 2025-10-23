import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  Modal,
  Dimensions,
  StyleSheet,
  BackHandler,
  TextInput,
  Linking,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from './ApiConfig';

const { width } = Dimensions.get('window');
const RAZORPAY_LINK = "https://razorpay.me/@mohammedadilbetageri?amount=zgioswZa9n4qt5x9yD7i%2BQ%3D%3D";

export default function EntryFees({ navigation, onContinue }) {
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [entryFeeStatus, setEntryFeeStatus] = useState('checking'); // checking, unpaid, pending, paid
  const [showOrderIdInput, setShowOrderIdInput] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  useEffect(() => {
    // Get user data and check entry fee status
    AsyncStorage.getItem('userData').then(d => {
      if (d) {
        const user = JSON.parse(d);
        setPhone(user.phoneNo || '');
      }
    });

    checkEntryFeeStatus();

    // Prevent back button until payment is complete
    const backAction = () => {
      if (entryFeeStatus !== 'paid') {
        Alert.alert(
          "Payment Required", 
          "Please complete the entry fee to continue.",
          [{ text: "OK", onPress: () => null }]
        );
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [entryFeeStatus]);

  // Check if user has already paid entry fee
  const checkEntryFeeStatus = async () => {
    const userData = await AsyncStorage.getItem('userData');
    if (!userData) {
      setEntryFeeStatus('unpaid');
      return;
    }

    const user = JSON.parse(userData);
    const phoneNo = user.phoneNo;

    if (!phoneNo) {
      setEntryFeeStatus('unpaid');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/check-entry-fee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNo })
      });

      const data = await res.json();
      
      if (data.success && data.entryFee === 'paid') {
        setEntryFeeStatus('paid');
        setTimeout(() => {
          if (onContinue) onContinue();
        }, 100);
      } else if (data.success && data.entryFee === 'pending') {
        setEntryFeeStatus('pending');
        setVerificationStatus('Your payment is under verification. Please wait for admin approval.');
      } else {
        setEntryFeeStatus('unpaid');
      }
    } catch (err) {
      console.error('Error checking entry fee status:', err);
      setEntryFeeStatus('unpaid');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userData');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handlePayNow = async () => {
    try {
      const supported = await Linking.canOpenURL(RAZORPAY_LINK);
      if (supported) {
        await Linking.openURL(RAZORPAY_LINK);
        // Show order ID input after opening payment link
        setTimeout(() => {
          setShowOrderIdInput(true);
          setPaymentStatus('Please complete the payment and copy your Order ID from Razorpay');
        }, 1000);
      } else {
        Alert.alert('Error', 'Cannot open payment link');
      }
    } catch (error) {
      console.error('Error opening Razorpay link:', error);
      Alert.alert('Error', 'Failed to open payment link');
    }
  };

  const handleSubmitOrderId = async () => {
    if (!orderId.trim()) {
      Alert.alert('Error', 'Please enter the Order ID');
      return;
    }

    if (!phone) {
      Alert.alert('Error', 'Phone number not found');
      return;
    }

    setIsVerifying(true);
    setVerificationStatus('Submitting order ID for verification...');

    try {
      console.log('Submitting order ID:', { phoneNo: phone, orderId: orderId.trim(), amount: 500 });
      
      const res = await fetch(`${API_BASE_URL}/submit-order-id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNo: phone, 
          orderId: orderId.trim(),
          amount: 500
        })
      });

      console.log('Response status:', res.status);
      
      // Check if response is ok
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server error: ${res.status}. ${errorText}`);
      }

      const data = await res.json();
      console.log('Response data:', data);
      
      if (data.success) {
        setEntryFeeStatus('pending');
        setVerificationStatus('✅ Order ID submitted successfully! Your payment is under verification. Admin will verify your payment soon.');
        setShowOrderIdInput(false);
        setOrderId('');
        Alert.alert(
          'Success',
          'Order ID submitted successfully! Your payment is under verification. This typically takes 4-24 hours.',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(data.error || data.message || 'Failed to submit order ID');
      }
    } catch (err) {
      console.error('Error submitting order ID:', err);
      const errorMessage = err.message || 'Failed to submit order ID. Please try again.';
      setVerificationStatus(`❌ ${errorMessage}`);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  // Checking Status Screen
  if (entryFeeStatus === 'checking') {
    return (
      <Modal visible={true} transparent={true} animationType="fade">
        <View style={styles.checkingOverlay}>
          <View style={styles.checkingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.checkingText}>Checking payment status...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  // Paid Status Screen
  if (entryFeeStatus === 'paid') {
    return (
      <Modal visible={true} transparent={true} animationType="fade">
        <View style={styles.checkingOverlay}>
          <View style={styles.checkingContainer}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.checkingText}>Payment verified! Redirecting to dashboard...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <>
      {/* Main Entry Fee Modal */}
      <Modal
        visible={true}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          if (entryFeeStatus !== 'paid') {
            Alert.alert(
              "Payment Required", 
              "Please complete the entry fee to continue."
            );
          }
        }}
      >
        <View style={styles.overlay}>
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalContainer}>
              
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>🎮 Game Entry - ₹500</Text>
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={() => setShowLogoutConfirm(true)}
                >
                  <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
              </View>

              {/* Body */}
              <View style={styles.body}>
                {entryFeeStatus === 'pending' ? (
                  // Pending Verification Status
                  <>
                    <View style={styles.pendingContainer}>
                      <ActivityIndicator size="large" color="#ffc107" style={styles.pendingSpinner} />
                      <Text style={styles.pendingTitle}>⏳ Payment Under Verification</Text>
                      <Text style={styles.pendingText}>
                        Your payment is currently under verification by our admin team. This process typically takes between 4 to 24 hours. Please try logging in again after some time.
                      </Text>
                    </View>

                    {verificationStatus ? (
                      <View style={styles.warningContainer}>
                        <Text style={styles.warningText}>{verificationStatus}</Text>
                      </View>
                    ) : null}

                    <TouchableOpacity
                      style={styles.refreshButton}
                      onPress={checkEntryFeeStatus}
                    >
                      <Text style={styles.buttonText}>🔄 Refresh Status</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  // Unpaid Status - Show Payment Flow
                  <>
                    <Text style={styles.title}>Join the Game Room</Text>
                    <Text style={styles.subtitle}>
                      Unlock your access to play and compete. Entry fee is ₹500.
                    </Text>

                    {/* Bonus Info */}
                    <View style={styles.bonusContainer}>
                      <Text style={styles.bonusText}>
                        🎁 <Text style={styles.bonusTextBold}>Bonus:</Text> Unlock 200 tokens instantly upon completing the entry fee!
                      </Text>
                    </View>

                    {/* Payment Status */}
                    {paymentStatus ? (
                      <View style={styles.infoContainer}>
                        <Text style={styles.infoText}>ℹ️ {paymentStatus}</Text>
                      </View>
                    ) : null}

                    {!showOrderIdInput ? (
                      <TouchableOpacity
                        style={styles.paymentButton}
                        onPress={handlePayNow}
                        disabled={loading}
                      >
                        <Text style={styles.buttonText}>💳 Pay ₹500 Now</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.orderIdSection}>
                        <View style={styles.warningContainer}>
                          <Text style={styles.warningText}>
                            <Text style={styles.warningTextBold}>⚠️ Important:</Text> After completing payment on Razorpay, copy the <Text style={styles.warningTextBold}>Order ID</Text> and paste it below.
                          </Text>
                        </View>

                        <Text style={styles.inputLabel}>
                          Enter Order ID <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g., order_abc123xyz"
                          value={orderId}
                          onChangeText={setOrderId}
                          editable={!isVerifying}
                          autoCapitalize="none"
                        />

                        {verificationStatus ? (
                          <View style={[
                            styles.statusContainer,
                            verificationStatus.includes('✅') ? styles.successContainer : styles.errorContainer
                          ]}>
                            <Text style={[
                              styles.statusText,
                              verificationStatus.includes('✅') ? styles.successText : styles.errorText
                            ]}>
                              {verificationStatus}
                            </Text>
                          </View>
                        ) : null}

                        <TouchableOpacity
                          style={[styles.submitButton, (isVerifying || !orderId.trim()) && styles.disabledButton]}
                          onPress={handleSubmitOrderId}
                          disabled={isVerifying || !orderId.trim()}
                        >
                          {isVerifying ? (
                            <View style={styles.loadingContainer}>
                              <ActivityIndicator size="small" color="#ffffff" />
                              <Text style={styles.buttonText}>Submitting...</Text>
                            </View>
                          ) : (
                            <Text style={styles.buttonText}>✅ Submit Order ID</Text>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.backButton}
                          onPress={() => {
                            setShowOrderIdInput(false);
                            setOrderId('');
                            setVerificationStatus('');
                            setPaymentStatus('');
                          }}
                        >
                          <Text style={styles.backButtonText}>← Back to Payment</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  🔐 Secure Payment by <Text style={styles.footerTextBold}>Razorpay</Text>
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmContainer}>
            <View style={styles.confirmHeader}>
              <Text style={styles.confirmHeaderText}>🚪 Logout Confirmation</Text>
            </View>
            
            <View style={styles.confirmBody}>
              <Text style={styles.confirmText}>
                Are you sure you want to logout?
              </Text>
              <Text style={styles.confirmSubText}>
                You'll need to login again to access the game.
              </Text>
            </View>
            
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleLogout}
              >
                <Text style={styles.confirmButtonText}>Yes, Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 450,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  body: {
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#007bff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  bonusContainer: {
    backgroundColor: '#e6f2ff',
    borderWidth: 1,
    borderColor: '#b8daff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  bonusText: {
    fontSize: 14,
    color: '#004085',
    textAlign: 'center',
  },
  bonusTextBold: {
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#f5faff',
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#003366',
  },
  paymentButton: {
    backgroundColor: '#007bff',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  orderIdSection: {
    marginTop: 16,
  },
  warningContainer: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffc107',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 13,
    color: '#856404',
  },
  warningTextBold: {
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#dc3545',
  },
  input: {
    borderWidth: 2,
    borderColor: '#007bff',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
  },
  statusContainer: {
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  successContainer: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
  },
  statusText: {
    fontSize: 14,
  },
  successText: {
    color: '#155724',
  },
  errorText: {
    color: '#721c24',
  },
  submitButton: {
    backgroundColor: '#28a745',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: '#007bff',
  },
  pendingContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  pendingSpinner: {
    marginBottom: 16,
  },
  pendingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffc107',
    marginBottom: 12,
    textAlign: 'center',
  },
  pendingText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  refreshButton: {
    backgroundColor: '#6c757d',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  footer: {
    backgroundColor: '#f1f9ff',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#007bff',
  },
  footerTextBold: {
    fontWeight: '600',
  },
  // Checking/Paid Status Styles
  checkingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  checkingText: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: 16,
  },
  successIcon: {
    fontSize: 60,
    color: '#28a745',
  },
  // Logout Confirmation Styles
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmContainer: {
    width: width * 0.8,
    maxWidth: 320,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  confirmHeader: {
    backgroundColor: '#dc3545',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  confirmHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  confirmBody: {
    padding: 20,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 15,
    color: '#495057',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmSubText: {
    fontSize: 13,
    color: '#6c757d',
    textAlign: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    borderRadius: 8,
    paddingVertical: 10,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#dc3545',
    borderRadius: 8,
    paddingVertical: 10,
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
});