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
  SafeAreaView
} from 'react-native';
import { CFPaymentGatewayService, CFErrorResponse } from 'react-native-cashfree-pg-sdk';
import { CFSession, CFDropCheckoutPayment, CFEnvironment, CFThemeBuilder } from 'cashfree-pg-api-contract';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from './ApiConfig';

const { width, height } = Dimensions.get('window');

const AddTokens = ({ navigation, onTokensUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [phone, setPhone] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [userTokens, setUserTokens] = useState(0);

  // Token price (₹1 per token)
  const TOKEN_PRICE = 1;

  useEffect(() => {
    AsyncStorage.getItem('userData').then(d => {
      if (d) {
        const user = JSON.parse(d);
        setPhone(user.phoneNo || '');
        setUserTokens(user.tokens || 0);
      }
    });
  }, []);

  // Function to get user-friendly error message
  const getPaymentErrorMessage = (error, orderId) => {
    if (!error) return 'Payment failed. Please try again.';

    const errorType = error.type || '';
    const errorCode = error.code || '';
    const errorMessage = error.message || '';

    console.log('Payment Error Details:', { errorType, errorCode, errorMessage, orderId });

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

        if (errorMessage && errorMessage.length > 10) {
          return errorMessage;
        }

        return 'Payment failed. Please try again or contact support if the issue persists.';
    }
  };

  const handleTokenAmountChange = (value) => {
    // Only allow positive integers
    if (value === '' || (/^\d+$/.test(value) && parseInt(value) > 0)) {
      setTokenAmount(value);
      setStatus('');
    }
  };

  const calculateAmount = () => {
    const tokens = parseInt(tokenAmount);
    return tokens ? tokens * TOKEN_PRICE : 0;
  };

  const calculateNetTokens = () => {
    const tokens = parseInt(tokenAmount);
    if (!tokens) return 0;
    const tax = Math.floor(tokens * 0.28);
    return tokens - tax;
  };

  const startPayment = async () => {
    const tokens = parseInt(tokenAmount);
    
    if (!tokens || tokens < 1) {
      return Alert.alert('Error', 'Please enter a valid token amount (minimum 1)');
    }

    if (tokens > 10000) {
      return Alert.alert('Error', 'Maximum 10,000 tokens allowed per transaction');
    }

    if (!phone) {
      return Alert.alert('Error', 'Phone number not found');
    }

    setLoading(true);
    setStatus('Creating payment order...');

    try {
      const amount = tokens * TOKEN_PRICE;

      // Step 1: Create Order
      const res = await fetch(`${API_BASE_URL}/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNo: phone, 
          amount, 
          orderNote: `Purchase ${tokens} tokens`
        })
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error || data.message);
      const { paymentSessionId, orderId } = data;

      setStatus('Opening payment window...');
      const session = new CFSession(paymentSessionId, orderId, CFEnvironment.SANDBOX);

      const theme = new CFThemeBuilder()
        .setNavigationBarBackgroundColor('#007bff')
        .setNavigationBarTextColor('#ffffff')
        .setButtonBackgroundColor('#007bff')
        .setButtonTextColor('#ffffff')
        .build();

      const payment = new CFDropCheckoutPayment(session, null, theme);

      CFPaymentGatewayService.setCallback({
        onVerify: async (returnedOrderId) => {
          console.log('Payment completed, verifying order:', returnedOrderId);
          
          try {
            setStatus('Verifying payment...');
            
            // Step 2: Verify Payment - WAIT for payment to be processed
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds for payment processing
            
            const vr = await fetch(`${API_BASE_URL}/verify-order`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: returnedOrderId })
            });
            const vd = await vr.json();
            
            console.log('Verification response:', vd);
            
            if (!vd.success) {
              throw new Error(`Payment verification failed: ${vd.message || 'Unknown error'}`);
            }
            
            if (vd.status !== 'PAID') {
              // If not PAID, wait a bit more and retry verification
              console.log('Payment status not PAID yet, retrying verification...');
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              const retryVerifyRes = await fetch(`${API_BASE_URL}/verify-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: returnedOrderId })
              });
              const retryVerifyData = await retryVerifyRes.json();
              
              console.log('Retry verification response:', retryVerifyData);
              
              if (!retryVerifyData.success || retryVerifyData.status !== 'PAID') {
                throw new Error(`Payment verification failed. Status: ${retryVerifyData.status || 'Unknown'}`);
              }
            }

            setStatus('Adding tokens to your account...');
            
            // Step 3: Add Tokens - Only after successful verification
            const addTokensRes = await fetch(`${API_BASE_URL}/add-tokens`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phoneNo: phone,
                orderId: returnedOrderId,
                amount: tokens
              })
            });

            const tokensData = await addTokensRes.json();
            console.log('Add tokens response:', tokensData);
            
            if (!tokensData.success) {
              throw new Error(`Failed to add tokens: ${tokensData.message || 'Unknown error'}`);
            }

            // Update local state and AsyncStorage
            const newTokenBalance = tokensData.tokens;
            setUserTokens(newTokenBalance);
            
            // Update AsyncStorage
            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
              const updatedUserData = { ...JSON.parse(userData), tokens: newTokenBalance };
              await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
            }

            setStatus(`Success! ${tokens} tokens added to your account!`);
            setTokenAmount('');
            
            // Notify parent component
            if (onTokensUpdated) {
              onTokensUpdated(newTokenBalance);
            }

            // Show success alert
            Alert.alert(
              'Success!', 
              `${tokens} tokens have been successfully added to your account!`,
              [
                {
                  text: 'OK',
                  onPress: () => {
                    if (navigation) {
                      navigation.goBack();
                    }
                  }
                }
              ]
            );

          } catch (err) {
            console.error('Verification/Token Addition Error:', err);
            setStatus(`Verification Error: ${err.message}`);
            
            Alert.alert(
              'Verification Error', 
              `Payment completed but verification failed: ${err.message}. Please contact support with order ID: ${returnedOrderId}`,
              [
                {
                  text: 'OK',
                  onPress: () => setStatus('')
                }
              ]
            );
          } finally {
            setLoading(false);
          }
        },
        onError: (error, returnedOrderId) => {
          console.error('Payment Error:', { error, orderId: returnedOrderId });
          setLoading(false);
          
          const userFriendlyMessage = getPaymentErrorMessage(error, returnedOrderId);
          
          setStatus('Payment failed. Please try again.');
          
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
        }
      });

      // Start the payment process
      await CFPaymentGatewayService.doPayment(payment);
      
    } catch (err) {
      console.error('Payment Setup Error:', err);
      setStatus(`Error: ${err.message}`);
      Alert.alert('Error', err.message);
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (navigation) {
      navigation.goBack();
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
        <View style={styles.placeholder} />
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

          {/* Price Display */}
          {tokenAmount && !isNaN(parseInt(tokenAmount)) && (
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Total Amount to Pay</Text>
              <Text style={styles.priceAmount}>
                ₹{calculateAmount().toLocaleString()}
              </Text>
              <Text style={styles.priceNote}>₹{TOKEN_PRICE} per token</Text>
            </View>
          )}

          {/* Tax Calculation */}
          {tokenAmount && !isNaN(parseInt(tokenAmount)) && calculateNetTokens() > 0 && (
            <View style={styles.taxContainer}>
              <View style={styles.taxRow}>
                <View style={styles.taxItem}>
                  <Text style={styles.taxLabel}>Purchased</Text>
                  <Text style={styles.taxValue}>
                    {parseInt(tokenAmount).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.taxItem}>
                  <Text style={[styles.taxLabel, styles.taxDeduction]}>Tax (28%)</Text>
                  <Text style={[styles.taxValue, styles.taxDeduction]}>
                    -{(parseInt(tokenAmount) - calculateNetTokens()).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.taxItem}>
                  <Text style={styles.taxLabel}>You Get</Text>
                  <Text style={[styles.taxValue, styles.taxFinal]}>
                    {calculateNetTokens().toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Tax Information */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>📋 Important Tax Information</Text>
            <Text style={styles.infoText}>
              • GST: 28% GST is applicable on all token purchases as per Indian tax regulations{'\n'}
              • Processing Fee: Cashfree may charge up to 2% processing fee depending on your payment method{'\n'}
              • Final Amount: The exact total will be confirmed at checkout
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
            onPress={startPayment}
            disabled={!tokenAmount || !parseInt(tokenAmount) || loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.buttonText}>Processing...</Text>
              </View>
            ) : tokenAmount && parseInt(tokenAmount) > 0 ? (
              <Text style={styles.buttonText}>Proceed to Pay ₹{calculateAmount()}</Text>
            ) : (
              <Text style={styles.buttonText}>Enter Amount to Continue</Text>
            )}
          </TouchableOpacity>

          {/* Security Info */}
          <View style={styles.securityContainer}>
            <Text style={styles.securityText}>
              🔒 Secure Payment powered by Cashfree Payments
            </Text>
          </View>
        </View>
      </ScrollView>
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
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  placeholder: {
    width: 60,
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
  },
  balanceLabel: {
    fontSize: 14,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
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
    paddingRight: 70,
  },
  inputSuffix: {
    position: 'absolute',
    right: 14,
    top: '50%',
    transform: [{ translateY: -10 }],
    color: '#9ca3af',
    fontSize: 16,
  },
  priceContainer: {
    backgroundColor: '#ecfdf5',
    borderWidth: 2,
    borderColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: '#065f46',
    marginBottom: 4,
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#065f46',
  },
  priceNote: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
  },
  taxContainer: {
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taxItem: {
    flex: 1,
    alignItems: 'center',
  },
  taxLabel: {
    fontSize: 12,
    color: '#065f46',
    marginBottom: 4,
  },
  taxValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065f46',
  },
  taxDeduction: {
    color: '#dc2626',
  },
  taxFinal: {
    fontSize: 18,
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
  statusContainer: {
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 14,
    color: '#0066cc',
    textAlign: 'center',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#f87171',
    borderWidth: 1,
  },
  errorText: {
    color: '#dc2626',
  },
  paymentButton: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#007bff',
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
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 8,
  },
  securityContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  securityText: {
    fontSize: 12,
    color: '#64748b',
  },
});

export default AddTokens;