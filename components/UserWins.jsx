import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from './ApiConfig';

const { width } = Dimensions.get('window');

export default function UserWins({ navigation }) {
  const [wins, setWins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');
  const [wonTokens, setWonTokens] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferMessage, setTransferMessage] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  // Validate amount format (allows 1 decimal place)
  const validateAmountFormat = (amount) => {
    const regex = /^\d+(\.\d)?$/;
    return regex.test(amount);
  };

  // Format number to 1 decimal place
  const formatToOneDecimal = (num) => {
    return parseFloat(num).toFixed(1);
  };

  // Handle amount input change with decimal validation
  const handleAmountChange = (value) => {
    // Allow only numbers and one decimal point
    value = value.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const decimalCount = (value.match(/\./g) || []).length;
    if (decimalCount > 1) {
      value = value.substring(0, value.lastIndexOf('.'));
    }
    
    // Limit to 1 decimal place
    if (value.includes('.')) {
      const parts = value.split('.');
      if (parts[1].length > 1) {
        value = parts[0] + '.' + parts[1].substring(0, 1);
      }
    }
    
    setTransferAmount(value);
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Get phone number from AsyncStorage
      const userDataRaw = await AsyncStorage.getItem('userData');
      const userData = userDataRaw ? JSON.parse(userDataRaw) : null;
      const phoneNo = userData?.phoneNo;

      if (!phoneNo) {
        setError('No phone number found');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/user-profile/json/${phoneNo}`);
      const data = await response.json();

      if (data.success && data.userData) {
        setUserName(data.userData.name || data.userData.phoneNo);
        setWonTokens(data.userData.wontokens || 0);

        if (data.userData.game1 && data.userData.game1.wins) {
          const winsObj = data.userData.game1.wins;
          const winsArray = Object.entries(winsObj).map(([id, win]) => ({
            id,
            ...win
          }));

          winsArray.sort((a, b) => b.timestamp - a.timestamp);
          setWins(winsArray);
        }
      } else {
        setError(data.message || 'Failed to fetch user data');
      }
    } catch (err) {
      setError('Error loading data: ' + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserData();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleTransferToGame = () => {
    setShowTransferModal(true);
    setTransferAmount('');
    setTransferMessage('');
  };

  const handleCloseModal = () => {
    setShowTransferModal(false);
    setTransferAmount('');
    setTransferMessage('');
  };

  const handleTransferWonTokens = async () => {
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      setTransferMessage('Please enter a valid amount');
      return;
    }

    // Validate amount format (allows 1 decimal place)
    if (!validateAmountFormat(transferAmount)) {
      setTransferMessage('Only 1 decimal place allowed (e.g., 10.5)');
      return;
    }

    const amount = parseFloat(transferAmount);
    if (amount > wonTokens) {
      setTransferMessage('Insufficient won tokens');
      return;
    }

    setTransferring(true);
    setTransferMessage('');

    try {
      const storedUserData = JSON.parse(await AsyncStorage.getItem('userData'));
      if (!storedUserData || !storedUserData.phoneNo) {
        throw new Error('User data not found');
      }

      const response = await fetch(`${API_BASE_URL}/add-won-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNo: storedUserData.phoneNo,
          requestedAmount: amount
        })
      });

      const data = await response.json();

      if (data.success) {
        setTransferMessage(`Success! ${data.data.tokensAdded} tokens added to game after 28% tax deduction`);
        
        // Update local state
        setWonTokens(data.data.newWonTokens);
        
        // Update AsyncStorage
        const storedData = JSON.parse(await AsyncStorage.getItem('userData'));
        if (storedData) {
          storedData.wontokens = data.data.newWonTokens;
          storedData.tokens = data.data.newTokens;
          await AsyncStorage.setItem('userData', JSON.stringify(storedData));
        }
        
        setTransferAmount('');
        setTimeout(() => {
          setShowTransferModal(false);
          setTransferMessage('');
          // Refresh user data to get updated tokens
          fetchUserData();
        }, 2000);
      } else {
        setTransferMessage(data.error || 'Failed to transfer tokens');
      }
    } catch (error) {
      console.error('Error transferring won tokens:', error);
      setTransferMessage('Error transferring tokens');
    } finally {
      setTransferring(false);
    }
  };

  const handleWithdraw = () => {
    navigation.navigate('Withdraw');
  };

  // Calculate tax and tokens for preview
  const calculateTransferPreview = () => {
    if (!transferAmount || isNaN(parseFloat(transferAmount))) {
      return null;
    }
    
    const amount = parseFloat(transferAmount);
    const tax = parseFloat((amount * 0.28).toFixed(1));
    const tokensAfterTax = parseFloat((amount - tax).toFixed(1));
    
    return {
      amount,
      tax,
      tokensAfterTax
    };
  };

  const transferPreview = calculateTransferPreview();

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Wins</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading wins...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Wins</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Transfer Modal */}
      <Modal
        visible={showTransferModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                <Text style={styles.modalIcon}>🔄 </Text>
                Transfer Won Tokens to Game
              </Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={handleCloseModal}
                disabled={transferring}
              >
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Enter Amount to Transfer</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="Enter amount"
                  value={transferAmount}
                  onChangeText={handleAmountChange}
                  editable={!transferring}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.inputHelp}>
                  Available Won Tokens: <Text style={styles.helpBold}>₹{formatToOneDecimal(wonTokens)}</Text>
                </Text>
              </View>
              
              {transferPreview && (
                <View style={styles.previewCard}>
                  <View style={styles.previewRow}>
                    <View style={styles.previewColumn}>
                      <Text style={styles.previewLabel}>Transfer From</Text>
                      <Text style={styles.previewAmount}>₹{formatToOneDecimal(transferPreview.amount)}</Text>
                      <Text style={styles.previewSubtext}>Won Tokens</Text>
                    </View>
                    <View style={styles.previewColumn}>
                      <Text style={styles.previewLabel}>Tax (28%)</Text>
                      <Text style={styles.previewTax}>-₹{formatToOneDecimal(transferPreview.tax)}</Text>
                    </View>
                    <View style={styles.previewColumn}>
                      <Text style={styles.previewLabel}>Add To Game</Text>
                      <Text style={styles.previewFinal}>₹{formatToOneDecimal(transferPreview.tokensAfterTax)}</Text>
                      <Text style={styles.previewSubtext}>Tokens</Text>
                    </View>
                  </View>
                </View>
              )}

              {transferMessage ? (
                <View style={[
                  styles.message,
                  transferMessage.includes('Success') ? styles.successMessage : styles.errorMessage
                ]}>
                  <Text style={styles.messageText}>{transferMessage}</Text>
                </View>
              ) : null}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCloseModal}
                disabled={transferring}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.transferModalButton,
                  (transferring || !transferAmount || !validateAmountFormat(transferAmount) || parseFloat(transferAmount) > wonTokens) && styles.disabledButton
                ]}
                onPress={handleTransferWonTokens}
                disabled={transferring || !transferAmount || !validateAmountFormat(transferAmount) || parseFloat(transferAmount) > wonTokens}
              >
                {transferring ? (
                  <>
                    <ActivityIndicator size="small" color="white" style={styles.transferSpinner} />
                    <Text style={styles.transferButtonText}>Transferring...</Text>
                  </>
                ) : (
                  <Text style={styles.transferButtonText}>Transfer Tokens</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🏆 My Wins</Text>
          {userName ? <Text style={styles.userName}>Welcome, {userName}</Text> : null}
        </View>
        
        {/* Won Tokens Section */}
        <View style={styles.wonTokensSection}>
          <View style={styles.wonTokensCard}>
            <View style={styles.wonTokensHeader}>
              <Text style={styles.wonTokensLabel}>Won Tokens</Text>
              <Text style={styles.wonTokensAmount}>₹{formatToOneDecimal(wonTokens)}</Text>
            </View>
            
            <View style={styles.buttonsContainer}>
              <TouchableOpacity 
                style={styles.transferButton}
                onPress={handleTransferToGame}
              >
                <Text style={styles.buttonIcon}>🔄 </Text>
                <Text style={styles.buttonText}>Transfer to Game</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.withdrawButton}
                onPress={handleWithdraw}
              >
                <Text style={styles.buttonIcon}>💸 </Text>
                <Text style={styles.buttonText}>Withdraw</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
        }
      >
        {wins.length === 0 ? (
          <View style={styles.noWins}>
            <Text style={styles.noWinsIcon}>📭</Text>
            <Text style={styles.noWinsText}>No wins yet. Keep playing!</Text>
            <Text style={styles.noWinsSubtext}>Your winning history will appear here</Text>
          </View>
        ) : (
          <View style={styles.winsContainer}>
            {wins.map((win, index) => (
              <View key={win.id} style={styles.winCard}>
                <View style={styles.winHeader}>
                  <View style={styles.dateSection}>
                    <Text style={styles.dateMain}>{formatDate(win.date)}</Text>
                    <Text style={styles.dateTime}>{formatTime(win.timestamp)}</Text>
                  </View>
                  <View style={styles.sessionBadge}>
                    <Text style={styles.sessionText}>
                      {win.session?.replace('session', 'S')}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.winDetails}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Bet Amount</Text>
                      <Text style={styles.betAmount}>₹{formatToOneDecimal(win.betAmount)}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Selected</Text>
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedNumber}>{win.selectedNumbers}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Win Type</Text>
                      <Text style={styles.winType}>{win.winType}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Amount Won</Text>
                      <View style={styles.amountWonContainer}>
                        <Text style={styles.amountWon}>₹{formatToOneDecimal(win.amountWon)}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  header: {
    backgroundColor: '#2563eb',
    paddingVertical: 30,
    paddingHorizontal: 20,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: -0.5
  },
  userName: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.95,
    fontWeight: '500',
    marginTop: 8,
  },
  wonTokensSection: {
    marginTop: 10,
  },
  wonTokensCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  wonTokensHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  wonTokensLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    opacity: 0.9,
  },
  wonTokensAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 15,
    flexWrap: 'wrap',
  },
  transferButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  withdrawButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    borderRadius: 12,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonIcon: {
    fontSize: 16,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  content: {
    flex: 1
  },
  contentContainer: {
    padding: 16
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500'
  },
  errorContainer: {
    padding: 60,
    alignItems: 'center'
  },
  errorText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fca5a5',
    textAlign: 'center'
  },
  noWins: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 60,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  noWinsIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  noWinsText: {
    fontSize: 20,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center'
  },
  noWinsSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
    textAlign: 'center'
  },
  winsContainer: {
    gap: 12
  },
  winCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  winHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  dateSection: {
    flex: 1
  },
  dateMain: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2
  },
  dateTime: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500'
  },
  sessionBadge: {
    backgroundColor: '#dbeafe',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#93c5fd'
  },
  sessionText: {
    color: '#1e40af',
    fontSize: 13,
    fontWeight: '700'
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12
  },
  winDetails: {
    gap: 12
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  detailItem: {
    flex: 1
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  betAmount: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600'
  },
  selectedBadge: {
    backgroundColor: '#fef3c7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fcd34d',
    alignSelf: 'flex-start'
  },
  selectedNumber: {
    color: '#92400e',
    fontSize: 14,
    fontWeight: '700'
  },
  winType: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  amountWonContainer: {
    backgroundColor: '#d1fae5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6ee7b7',
    alignSelf: 'flex-start'
  },
  amountWon: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '800'
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 60,
    elevation: 20,
  },
  modalHeader: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    flex: 1,
  },
  modalIcon: {
    fontSize: 20,
  },
  modalCloseButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  amountInput: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  inputHelp: {
    fontSize: 12,
    color: '#6b7280',
  },
  helpBold: {
    fontWeight: '600',
  },
  previewCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewColumn: {
    flex: 1,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 12,
    color: '#065f46',
    marginBottom: 4,
  },
  previewAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065f46',
  },
  previewTax: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
  },
  previewFinal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#065f46',
  },
  previewSubtext: {
    fontSize: 10,
    color: '#065f46',
    marginTop: 2,
  },
  message: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  messageText: {
    textAlign: 'center',
    fontWeight: '500',
  },
  successMessage: {
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  errorMessage: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  transferModalButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  transferButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  transferSpinner: {
    marginRight: 8,
  },
});