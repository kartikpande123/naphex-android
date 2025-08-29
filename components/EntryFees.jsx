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
  BackHandler
} from 'react-native';
import { CFPaymentGatewayService, CFErrorResponse } from 'react-native-cashfree-pg-sdk';
import { CFSession, CFDropCheckoutPayment, CFEnvironment, CFThemeBuilder } from 'cashfree-pg-api-contract';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from './ApiConfig';

const { width, height } = Dimensions.get('window');

export default function EntryFees({ navigation, onContinue }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('userData').then(d => {
      if (d) {
        const user = JSON.parse(d);
        setPhone(user.phoneNo || '');
      }
    });

    // Prevent back button until payment is complete
    const backAction = () => {
      if (!paymentSuccess) {
        Alert.alert(
          "Payment Required", 
          "Please complete the entry fee to continue.",
          [{ text: "OK", onPress: () => null }]
        );
        return true; // Prevent default back action
      }
      return false; // Allow default back action
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [paymentSuccess]);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userData');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  // Function to get user-friendly error message
  const getPaymentErrorMessage = (error, orderId) => {
    if (!error) return 'Payment failed. Please try again.';

    // Check error type and code for specific messages
    const errorType = error.type || '';
    const errorCode = error.code || '';
    const errorMessage = error.message || '';

    console.log('Payment Error Details:', { errorType, errorCode, errorMessage, orderId });

    // Handle different types of payment failures
    switch (errorType) {
      case 'PAYMENT_DECLINED':
        if (errorCode === 'INSUFFICIENT_FUNDS' || errorMessage.toLowerCase().includes('insufficient')) {
          return 'Payment declined due to insufficient funds in your account. Please check your balance and try again.';
        }
        if (errorCode === 'BANK_DECLINED' || errorMessage.toLowerCase().includes('bank declined')) {
          return 'Payment declined by your bank. Please contact your bank or try with a different payment method.';
        }
        if (errorCode === 'CARD_DECLINED' || errorMessage.toLowerCase().includes('card declined')) {
          return 'Your card was declined. Please check your card details or try with a different card.';
        }
        return 'Payment was declined by your bank. Please try with a different payment method or contact your bank.';

      case 'PAYMENT_TIMEOUT':
        return 'Payment timed out. Please check your internet connection and try again.';

      case 'USER_CANCELLED':
        return 'Payment was cancelled. You can try again when ready.';

      case 'NETWORK_ERROR':
        return 'Network error occurred. Please check your internet connection and try again.';

      case 'AUTHENTICATION_FAILED':
        return 'Payment authentication failed. Please verify your payment details and try again.';

      case 'PAYMENT_FAILED':
        if (errorMessage.toLowerCase().includes('insufficient')) {
          return 'Payment failed due to insufficient funds. Please add money to your account and try again.';
        }
        if (errorMessage.toLowerCase().includes('expired')) {
          return 'Payment failed because your card has expired. Please use a valid card.';
        }
        if (errorMessage.toLowerCase().includes('limit exceeded')) {
          return 'Payment failed due to transaction limit exceeded. Please contact your bank or try with a smaller amount.';
        }
        return 'Payment failed. Please check your payment details and try again.';

      default:
        // Check error message for common patterns
        const lowerErrorMessage = errorMessage.toLowerCase();
        
        if (lowerErrorMessage.includes('insufficient funds') || lowerErrorMessage.includes('insufficient balance')) {
          return 'Payment failed due to insufficient funds in your account. Please add money and try again.';
        }
        
        if (lowerErrorMessage.includes('bank declined') || lowerErrorMessage.includes('declined by bank')) {
          return 'Payment declined by your bank. Please contact your bank or try a different payment method.';
        }
        
        if (lowerErrorMessage.includes('card expired') || lowerErrorMessage.includes('expired card')) {
          return 'Payment failed because your card has expired. Please use a valid card.';
        }
        
        if (lowerErrorMessage.includes('invalid card') || lowerErrorMessage.includes('card not valid')) {
          return 'Invalid card details. Please check your card information and try again.';
        }
        
        if (lowerErrorMessage.includes('limit exceeded') || lowerErrorMessage.includes('transaction limit')) {
          return 'Transaction limit exceeded. Please contact your bank or try with a smaller amount.';
        }
        
        if (lowerErrorMessage.includes('network') || lowerErrorMessage.includes('connection')) {
          return 'Network error. Please check your internet connection and try again.';
        }
        
        if (lowerErrorMessage.includes('timeout')) {
          return 'Payment timed out. Please try again.';
        }
        
        if (lowerErrorMessage.includes('cancelled') || lowerErrorMessage.includes('canceled')) {
          return 'Payment was cancelled. You can try again when ready.';
        }

        // Return the original error message if it's descriptive enough
        if (errorMessage && errorMessage.length > 10) {
          return errorMessage;
        }

        return 'Payment failed. Please try again or contact support if the issue persists.';
    }
  };

  const startPayment = async () => {
    if (!phone) {
      return Alert.alert('Error', 'Phone number not found');
    }

    setLoading(true);
    setStatus('Creating payment order...');

    try {
      const res = await fetch(`${API_BASE_URL}/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNo: phone, amount: 500, orderNote: 'Entry Fee' })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || data.message);
      const { paymentSessionId, orderId } = data;

      setStatus('Opening payment window...');
      const session = new CFSession(paymentSessionId, orderId, CFEnvironment.SANDBOX);

      // Fixed theme builder - removed non-existent method
      const theme = new CFThemeBuilder()
        .setNavigationBarBackgroundColor('#007bff')
        .setNavigationBarTextColor('#ffffff')
        .setButtonBackgroundColor('#007bff')
        .setButtonTextColor('#ffffff')
        .build();

      const payment = new CFDropCheckoutPayment(session, null, theme);

      CFPaymentGatewayService.setCallback({
        onVerify: async (returnedOrderId) => {
          setStatus('Verifying payment...');
          try {
            const vr = await fetch(`${API_BASE_URL}/verify-order`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: returnedOrderId })
            });
            const vd = await vr.json();
            if (!vd.success || vd.status !== 'PAID') {
              throw new Error('Payment verification failed');
            }

            setStatus('Recording entry fee...');
            await fetch(`${API_BASE_URL}/pay-entry-fee`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                phoneNo: phone, 
                orderId: returnedOrderId, 
                paymentDetails: vd.paymentDetails 
              })
            });

            setStatus('Payment successful! You got 200 tokens. Congratulations!');
            setPaymentSuccess(true);
          } catch (err) {
            setStatus(`Error: ${err.message}`);
            Alert.alert('Verification Error', err.message);
          } finally {
            setLoading(false);
          }
        },
        onError: (error, returnedOrderId) => {
          setLoading(false);
          
          // Get user-friendly error message
          const userFriendlyMessage = getPaymentErrorMessage(error, returnedOrderId);
          
          setStatus('Payment failed. Please try again.');
          
          // Show detailed error in alert
          Alert.alert(
            'Payment Failed', 
            userFriendlyMessage,
            [
              {
                text: 'Try Again',
                onPress: () => {
                  setStatus('');
                }
              }
            ]
          );
          
          // Log detailed error for debugging
          console.error('Payment Error:', {
            error,
            orderId: returnedOrderId,
            userMessage: userFriendlyMessage
          });
        }
      });

      await CFPaymentGatewayService.doPayment(payment);
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
      Alert.alert('Error', err.message);
      setLoading(false);
    }
  };

  return (
    <>
      {/* Main Entry Fee Modal */}
      <Modal
        visible={true}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          if (!paymentSuccess) {
            Alert.alert(
              "Payment Required", 
              "Please complete the entry fee to continue."
            );
          }
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Game Entry Fee</Text>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={() => setShowLogoutConfirm(true)}
              >
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>

            {/* Body */}
            <View style={styles.body}>
              <View style={styles.priceContainer}>
                <Text style={styles.priceSymbol}>₹</Text>
                <Text style={styles.priceAmount}>500</Text>
              </View>
              
              <Text style={styles.title}>Join the Game Room</Text>
              <Text style={styles.subtitle}>
                Complete your entry fee payment to unlock game access and receive bonus tokens.
              </Text>

              {/* Bonus Info */}
              <View style={styles.bonusContainer}>
                <Text style={styles.bonusText}>
                  Bonus: Get 200 tokens instantly after payment
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
              {!paymentSuccess ? (
                <TouchableOpacity
                  style={[styles.paymentButton, loading && styles.disabledButton]}
                  onPress={startPayment}
                  disabled={loading}
                >
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text style={styles.buttonText}>Processing...</Text>
                    </View>
                  ) : (
                    <Text style={styles.buttonText}>Pay ₹500</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.successButton}
                  onPress={() => {
                    setPaymentSuccess(true);
                    if (onContinue) {
                      onContinue(); // Call the parent's onContinue function to hide popup
                    }
                  }}
                >
                  <Text style={styles.buttonText}>Continue To Dashboard</Text>
                </TouchableOpacity>
              )}

              {/* Footer */}
              <Text style={styles.footerText}>
                Secure payment powered by Cashfree
              </Text>
            </View>
          </View>
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
            <Text style={styles.confirmTitle}>Logout Confirmation</Text>
            <Text style={styles.confirmText}>
              Are you sure you want to logout? You'll need to login again to access the game.
            </Text>
            
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
                <Text style={styles.confirmButtonText}>Logout</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
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
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceSymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: '#007bff',
  },
  priceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007bff',
    marginLeft: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  bonusContainer: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    width: '100%',
  },
  bonusText: {
    fontSize: 14,
    color: '#495057',
    textAlign: 'center',
    fontWeight: '500',
  },
  statusContainer: {
    backgroundColor: '#e7f3ff',
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
    width: '100%',
  },
  statusText: {
    fontSize: 14,
    color: '#0066cc',
    textAlign: 'center',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#ffe6e6',
    borderColor: '#ff9999',
    borderWidth: 1,
  },
  errorText: {
    color: '#cc0000',
  },
  paymentButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  successButton: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  // Logout Confirmation Styles
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmContainer: {
    width: width * 0.8,
    maxWidth: 300,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  confirmText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    borderRadius: 6,
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
    borderRadius: 6,
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