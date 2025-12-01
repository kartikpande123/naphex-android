import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
  StatusBar,
  RefreshControl,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import API_BASE_URL from './ApiConfig';
import BottomNavigation from './BottomNavigation';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const FriendsEarnings = ({ navigation }) => {
  const [earningsData, setEarningsData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [bonusHistory, setBonusHistory] = useState([]);
  const [filteredBonusHistory, setFilteredBonusHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showFullUI, setShowFullUI] = useState(false);
  const [totalPlayedAmount, setTotalPlayedAmount] = useState(0);
  const [dateSearch, setDateSearch] = useState('');

  // New states for add tokens functionality
  const [showAddTokensModal, setShowAddTokensModal] = useState(false);
  const [requestedAmount, setRequestedAmount] = useState('');
  const [addingTokens, setAddingTokens] = useState(false);
  const [addTokensMessage, setAddTokensMessage] = useState('');

  // Enhanced Color Scheme
  const colors = {
    primary: '#2563eb',
    secondary: '#7c3aed',
    accent: '#06b6d4',
    success: '#10b981',
    warning: '#f59e0b',
    lightBg: '#f8fafc',
    cardBg: '#ffffff',
    text: '#1e293b',
    textSecondary: '#64748b',
    white: '#ffffff',
    border: '#e2e8f0',
    shadow: 'rgba(0, 0, 0, 0.1)',
  };

  // Format number to 1 decimal place
  const formatToOneDecimal = num => {
    return parseFloat(num).toFixed(1);
  };

  // Validate amount format (allows 1 decimal place)
  const validateAmountFormat = amount => {
    const regex = /^\d+(\.\d)?$/;
    return regex.test(amount);
  };

  // Handle amount input change with decimal validation
  const handleAmountChange = value => {
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

    setRequestedAmount(value);
  };

  // Transfer Binary Tokens to Game Tokens Function
  const handleTransferBinaryTokens = async () => {
    if (!requestedAmount || requestedAmount <= 0) {
      setAddTokensMessage('Please enter a valid amount');
      return;
    }

    // Validate amount format (allows 1 decimal place)
    if (!validateAmountFormat(requestedAmount)) {
      setAddTokensMessage('Only 1 decimal place allowed (e.g., 10.5)');
      return;
    }

    const amount = parseFloat(requestedAmount);
    const currentBinaryTokens = parseFloat(userData?.binaryTokens || 0);

    if (amount > currentBinaryTokens) {
      setAddTokensMessage('Insufficient binary tokens');
      return;
    }

    setAddingTokens(true);
    setAddTokensMessage('');

    try {
      const storedUserDataString = await AsyncStorage.getItem('userData');
      if (!storedUserDataString) {
        throw new Error('User data not found in storage');
      }

      const storedUserData = JSON.parse(storedUserDataString);
      if (!storedUserData || !storedUserData.phoneNo) {
        throw new Error('Invalid user data');
      }

      const response = await axios.post(`${API_BASE_URL}/add-binary-tokens`, {
        phoneNo: storedUserData.phoneNo,
        requestedAmount: amount,
      });

      if (response.data.success) {
        setAddTokensMessage(
          `Success! ${response.data.data.tokensAdded} tokens added to game after 28% tax deduction`,
        );

        // Update local user data
        const updatedUserData = {
          ...userData,
          binaryTokens: response.data.data.newBinaryTokens,
          tokens: response.data.data.newTokens,
        };
        setUserData(updatedUserData);

        // Update AsyncStorage
        await AsyncStorage.setItem(
          'userData',
          JSON.stringify({
            ...storedUserData,
            binaryTokens: response.data.data.newBinaryTokens,
            tokens: response.data.data.newTokens,
          }),
        );

        setRequestedAmount('');
        setTimeout(() => {
          setShowAddTokensModal(false);
          setAddTokensMessage('');
        }, 2000);
      }
    } catch (error) {
      console.error('Error transferring binary tokens:', error);
      setAddTokensMessage(
        error.response?.data?.error || 'Failed to transfer tokens',
      );
    } finally {
      setAddingTokens(false);
    }
  };

  // Open Transfer Tokens Modal
  const handleAddIntoGame = () => {
    setShowAddTokensModal(true);
    setRequestedAmount('');
    setAddTokensMessage('');
  };

  // Close Modal
  const handleCloseModal = () => {
    setShowAddTokensModal(false);
    setRequestedAmount('');
    setAddTokensMessage('');
  };

  // Handle withdraw tokens
  const handleWithdrawTokens = () => {
    navigation.navigate('Withdraw');
  };

  // Function to sort bonus history by date (newest first)
  const sortBonusHistoryByDate = history => {
    return history.sort((a, b) => {
      if (!a.date || !b.date) return 0;

      const parseDate = dateStr => {
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            return new Date(parts[2], parts[1] - 1, parts[0]);
          }
        } else if (dateStr.includes('-')) {
          const parts = dateStr.split('-');
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              return new Date(parts[0], parts[1] - 1, parts[2]);
            } else {
              return new Date(parts[2], parts[1] - 1, parts[0]);
            }
          }
        }
        return new Date(dateStr);
      };

      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);

      return dateB - dateA;
    });
  };

  // Function to filter bonus history based on date search
  const filterBonusHistoryByDate = (history, searchTerm) => {
    if (!searchTerm.trim()) {
      return history.slice(0, 10);
    }

    let formattedSearch = searchTerm.replace(/[^\d]/g, '');

    if (formattedSearch.length >= 2) {
      formattedSearch =
        formattedSearch.substring(0, 2) + '/' + formattedSearch.substring(2);
    }
    if (formattedSearch.length >= 5) {
      formattedSearch =
        formattedSearch.substring(0, 5) + '/' + formattedSearch.substring(5, 9);
    }

    return history.filter(item => {
      if (!item.date) return false;

      let itemDateFormatted = item.date;

      if (item.date.includes('-')) {
        const parts = item.date.split('-');
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            itemDateFormatted = `${parts[2].padStart(
              2,
              '0',
            )}/${parts[1].padStart(2, '0')}/${parts[0]}`;
          } else {
            itemDateFormatted = `${parts[0].padStart(
              2,
              '0',
            )}/${parts[1].padStart(2, '0')}/${parts[2]}`;
          }
        }
      }

      return (
        itemDateFormatted.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
        itemDateFormatted
          .replace(/\//g, '')
          .startsWith(searchTerm.replace(/\//g, ''))
      );
    });
  };

  // Handle date search input change
  const handleDateSearchChange = value => {
    value = value.replace(/[^\d\/]/g, '');

    if (value.length === 2 && !value.includes('/')) {
      value = value + '/';
    } else if (value.length === 5 && value.split('/').length === 2) {
      value = value + '/';
    }

    if (value.length > 10) {
      value = value.substring(0, 10);
    }

    setDateSearch(value);

    const filtered = filterBonusHistoryByDate(bonusHistory, value);
    setFilteredBonusHistory(filtered);
  };

  // Clear date search
  const clearDateSearch = () => {
    setDateSearch('');
    setFilteredBonusHistory(bonusHistory.slice(0, 10));
  };

  // Fetch data function
  const fetchData = async () => {
    try {
      const storedUserDataString = await AsyncStorage.getItem('userData');
      if (!storedUserDataString) {
        throw new Error('User data not found in storage');
      }

      const storedUserData = JSON.parse(storedUserDataString);
      if (!storedUserData || !storedUserData.phoneNo) {
        throw new Error('Invalid user data');
      }

      setUserData(storedUserData);

      const profileResponse = await axios.get(
        `${API_BASE_URL}/user-profile/${storedUserData.phoneNo}`,
      );
      const profileData = JSON.parse(
        profileResponse.data.replace('data: ', ''),
      );

      if (profileData.success) {
        setUserData(profileData.userData);

        const totalPlayed =
          profileData.userData?.game1?.['total-bet-amount']?.totalAmount || 0;
        setTotalPlayedAmount(totalPlayed);
      }

      const userId = storedUserData?.userids?.myuserid;
      if (!userId) {
        throw new Error('User ID not found');
      }

      // Fetch latest earnings data
      const earningsResponse = await axios.get(`${API_BASE_URL}/latest`, {
        params: { userId },
      });

      if (earningsResponse.data.success) {
        setEarningsData(earningsResponse.data.data);
        setShowFullUI(true);
      } else {
        throw new Error(
          earningsResponse.data.message || 'Failed to fetch earnings data',
        );
      }

      // Fetch bonus history data
      const historyResponse = await axios.get(
        `${API_BASE_URL}/userDailyEarnings`,
        {
          params: { userId },
        },
      );

      if (historyResponse.data.success) {
        const sortedHistory = sortBonusHistoryByDate(historyResponse.data.data);
        setBonusHistory(sortedHistory);
        setFilteredBonusHistory(sortedHistory.slice(0, 10));
      } else {
        console.warn('No bonus history found or error fetching history');
        setBonusHistory([]);
        setFilteredBonusHistory([]);
      }
    } catch (err) {
      console.log('Error occurred:', err.message);
      if (
        err.response?.status === 404 ||
        err.message.includes('404') ||
        err.message.includes('Failed to fetch')
      ) {
        setShowFullUI(true);
        setEarningsData(null);
        setBonusHistory([]);
        setFilteredBonusHistory([]);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const navigateToBinaryTree = () => {
    navigation.navigate('UserBinaryTreeMobile');
  };

  // Get capital first letter from name
  const getNameInitial = name => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  // Calculate tax and tokens for preview
  const calculateTransferPreview = () => {
    if (!requestedAmount || isNaN(parseFloat(requestedAmount))) {
      return null;
    }

    const amount = parseFloat(requestedAmount);
    const tax = parseFloat((amount * 0.28).toFixed(1));
    const tokensAfterTax = parseFloat((amount - tax).toFixed(1));

    return {
      amount,
      tax,
      tokensAfterTax,
    };
  };

  const transferPreview = calculateTransferPreview();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading...
        </Text>
      </View>
    );
  }

  if (error && !showFullUI) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar backgroundColor={colors.error} barStyle="light-content" />
        <View
          style={[
            styles.errorCard,
            { backgroundColor: colors.cardBg, borderColor: colors.error },
          ]}
        >
          <Icon name="error" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            Error: {error}
          </Text>
        </View>
      </View>
    );
  }

  if (showFullUI || earningsData) {
    const totalBonus = earningsData?.totalBonusReceivedTillDate || 0;
    const halfBonus = totalBonus / 2;

    const leftBusiness = earningsData ? halfBonus : 'N/A';
    const rightBusiness = earningsData ? halfBonus : 'N/A';

    const userInitial = getNameInitial(userData?.name);

    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={colors.primary} barStyle="light-content" />

        {/* Transfer Tokens Modal */}
        <Modal
          visible={showAddTokensModal}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCloseModal}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[styles.modalContent, { backgroundColor: colors.cardBg }]}
            >
              <View
                style={[
                  styles.modalHeader,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Icon name="swap-horiz" size={24} color={colors.white} />
                <Text style={[styles.modalTitle, { color: colors.white }]}>
                  Transfer to Game Tokens
                </Text>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  style={styles.closeButton}
                >
                  <Icon name="close" size={24} color={colors.white} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={[styles.modalLabel, { color: colors.text }]}>
                  Enter Amount to Transfer
                </Text>
                <TextInput
                  style={[
                    styles.amountInput,
                    {
                      backgroundColor: colors.white,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="0.0"
                  placeholderTextColor={colors.textSecondary}
                  value={requestedAmount}
                  onChangeText={handleAmountChange}
                  editable={!addingTokens}
                  keyboardType="decimal-pad"
                />
                <Text
                  style={[
                    styles.availableText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Available Binary Tokens:{' '}
                  <Text style={{ color: colors.primary, fontWeight: 'bold' }}>
                    ₹{formatToOneDecimal(userData?.binaryTokens || 0)}
                  </Text>
                </Text>
                <Text style={[styles.noteText, { color: colors.warning }]}>
                  <Icon name="info" size={14} color={colors.warning} /> Note:
                  28% tax will be deducted. Only 1 decimal place allowed (e.g.,
                  10.5)
                </Text>

                {transferPreview && (
                  <View
                    style={[
                      styles.previewContainer,
                      { backgroundColor: colors.lightBg },
                    ]}
                  >
                    <View style={styles.previewRow}>
                      <View style={styles.previewColumn}>
                        <Text
                          style={[
                            styles.previewLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Transfer From
                        </Text>
                        <Text
                          style={[
                            styles.previewValue,
                            { color: colors.primary },
                          ]}
                        >
                          ₹{formatToOneDecimal(transferPreview.amount)}
                        </Text>
                        <Text
                          style={[
                            styles.previewSubtext,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Binary Tokens
                        </Text>
                      </View>
                      <View style={styles.previewColumn}>
                        <Text
                          style={[
                            styles.previewLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Tax (28%)
                        </Text>
                        <Text
                          style={[
                            styles.previewValue,
                            { color: colors.warning },
                          ]}
                        >
                          -₹{formatToOneDecimal(transferPreview.tax)}
                        </Text>
                      </View>
                      <View style={styles.previewColumn}>
                        <Text
                          style={[
                            styles.previewLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Add To Game
                        </Text>
                        <Text
                          style={[
                            styles.previewValue,
                            { color: colors.success },
                          ]}
                        >
                          ₹{formatToOneDecimal(transferPreview.tokensAfterTax)}
                        </Text>
                        <Text
                          style={[
                            styles.previewSubtext,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Tokens
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {addTokensMessage ? (
                  <View
                    style={[
                      styles.messageContainer,
                      {
                        backgroundColor: addTokensMessage.includes('Success')
                          ? '#d1fae5'
                          : '#fee2e2',
                        borderColor: addTokensMessage.includes('Success')
                          ? colors.success
                          : colors.error,
                      },
                    ]}
                  >
                    <Icon
                      name={
                        addTokensMessage.includes('Success')
                          ? 'check-circle'
                          : 'error'
                      }
                      size={20}
                      color={
                        addTokensMessage.includes('Success')
                          ? colors.success
                          : colors.error
                      }
                    />
                    <Text
                      style={[
                        styles.messageText,
                        {
                          color: addTokensMessage.includes('Success')
                            ? colors.success
                            : colors.error,
                        },
                      ]}
                    >
                      {addTokensMessage}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  disabled={addingTokens}
                  style={[
                    styles.modalButton,
                    styles.cancelButton,
                    { backgroundColor: colors.lightBg },
                  ]}
                >
                  <Text style={[styles.buttonText, { color: colors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleTransferBinaryTokens}
                  disabled={
                    addingTokens ||
                    !requestedAmount ||
                    !validateAmountFormat(requestedAmount) ||
                    parseFloat(requestedAmount) > (userData?.binaryTokens || 0)
                  }
                  style={[
                    styles.modalButton,
                    styles.transferButton,
                    {
                      backgroundColor: colors.primary,
                      opacity:
                        addingTokens ||
                        !requestedAmount ||
                        !validateAmountFormat(requestedAmount) ||
                        parseFloat(requestedAmount) >
                          (userData?.binaryTokens || 0)
                          ? 0.6
                          : 1,
                    },
                  ]}
                >
                  {addingTokens ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Icon name="swap-horiz" size={20} color={colors.white} />
                  )}
                  <Text
                    style={[
                      styles.buttonText,
                      { color: colors.white, marginLeft: 8 },
                    ]}
                  >
                    {addingTokens ? 'Transferring...' : 'Transfer Tokens'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.primary }]}>
            <View style={styles.headerContent}>
              <Icon name="trending-up" size={28} color={colors.white} />
              <Text style={[styles.headerTitle, { color: colors.white }]}>
                FRIENDS EARNINGS
              </Text>
            </View>
          </View>

          {/* Note Card */}
          <View
            style={[
              styles.noteCard,
              { backgroundColor: colors.cardBg, borderColor: colors.accent },
            ]}
          >
            <Icon name="info" size={20} color={colors.accent} />
            <Text style={[styles.noteText, { color: colors.text }]}>
              Note: The earnings data displayed reflects only the most recent
              day's earnings and gets refreshed {'\n'} everyday.
            </Text>
          </View>

          {/* User Info and Actions */}
          <View style={styles.userInfoMainContainer}>
            <View style={styles.userInfoTopRow}>
              <TouchableOpacity
                onPress={navigateToBinaryTree}
                style={[
                  styles.binaryButton,
                  {
                    backgroundColor: colors.secondary,
                    shadowColor: colors.shadow,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Icon name="account-tree" size={20} color={colors.white} />
                <Text
                  style={[styles.binaryButtonText, { color: colors.white }]}
                >
                  See Binary Tree
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.userInfoContainer,
                { backgroundColor: colors.cardBg },
              ]}
            >
              <View style={styles.userProfileSection}>
                <View
                  style={[
                    styles.userInitial,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text
                    style={[styles.userInitialText, { color: colors.white }]}
                  >
                    {userInitial}
                  </Text>
                </View>
                <Text
                  style={[styles.userName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {userData?.name || 'User'}
                </Text>
              </View>

              <View style={styles.tokensContainer}>
                <View style={styles.tokenItem}>
                  <Icon
                    name="account-balance-wallet"
                    size={16}
                    color={colors.secondary}
                  />
                  <Text style={[styles.tokenLabel, { color: colors.text }]}>
                    Binary:
                  </Text>
                  <View
                    style={[
                      styles.tokenBadge,
                      { backgroundColor: colors.secondary },
                    ]}
                  >
                    <Text style={[styles.tokenValue, { color: colors.white }]}>
                      ₹{formatToOneDecimal(userData?.binaryTokens || 0)}
                    </Text>
                  </View>
                </View>
                <View style={styles.tokenItem}>
                  <Icon
                    name="currency-rupee"
                    size={16}
                    color={colors.success}
                  />
                  <Text style={[styles.tokenLabel, { color: colors.text }]}>
                    Game:
                  </Text>
                  <View
                    style={[
                      styles.tokenBadge,
                      { backgroundColor: colors.success },
                    ]}
                  >
                    <Text style={[styles.tokenValue, { color: colors.white }]}>
                      ₹{formatToOneDecimal(userData?.tokens || 0)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  onPress={handleAddIntoGame}
                  style={[
                    styles.actionButton,
                    { backgroundColor: colors.success },
                  ]}
                  activeOpacity={0.8}
                >
                  <Icon name="swap-horiz" size={16} color={colors.white} />
                  <Text
                    style={[styles.actionButtonText, { color: colors.white }]}
                  >
                    Transfer to Game
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleWithdrawTokens}
                  style={[
                    styles.actionButton,
                    { backgroundColor: colors.accent },
                  ]}
                  activeOpacity={0.8}
                >
                  <Icon name="exit-to-app" size={16} color={colors.white} />
                  <Text
                    style={[styles.actionButtonText, { color: colors.white }]}
                  >
                    Withdraw
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Bonus Tree Structure */}
          <View style={[styles.treeCard, { backgroundColor: colors.cardBg }]}>
            <View
              style={[styles.treeHeader, { backgroundColor: colors.primary }]}
            >
              <Icon name="account-tree" size={20} color={colors.white} />
              <Text style={[styles.treeHeaderTitle, { color: colors.white }]}>
                Bonus Structure
              </Text>
            </View>

            <View style={styles.treeContent}>
              {/* Root Node */}
              <View style={styles.rootNodeContainer}>
                <View
                  style={[
                    styles.rootNode,
                    {
                      backgroundColor: colors.primary,
                      shadowColor: colors.shadow,
                    },
                  ]}
                >
                  <Text style={[styles.rootNodeText, { color: colors.white }]}>
                    {userInitial}
                  </Text>
                  <View
                    style={[
                      styles.youBadge,
                      { backgroundColor: colors.accent },
                    ]}
                  >
                    <Text
                      style={[styles.youBadgeText, { color: colors.white }]}
                    >
                      YOU
                    </Text>
                  </View>
                </View>
                <Text
                  style={[styles.rootNodeName, { color: colors.text }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {userData?.name || 'User'}
                </Text>
              </View>

              {/* Connecting Lines */}
              <View style={styles.connectingLines}>
                <View
                  style={[
                    styles.verticalLine,
                    { backgroundColor: colors.primary },
                  ]}
                />
                <View
                  style={[
                    styles.horizontalLine,
                    { backgroundColor: colors.primary },
                  ]}
                />
                <View
                  style={[
                    styles.leftVerticalLine,
                    { backgroundColor: colors.primary },
                  ]}
                />
                <View
                  style={[
                    styles.rightVerticalLine,
                    { backgroundColor: colors.primary },
                  ]}
                />
              </View>

              {/* Child Nodes */}
              <View style={styles.childNodesContainer}>
                {/* Left Business */}
                <View style={styles.childNode}>
                  <View
                    style={[
                      styles.businessCircle,
                      {
                        backgroundColor: colors.secondary,
                        shadowColor: colors.shadow,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.businessAmount, { color: colors.white }]}
                      numberOfLines={2}
                      adjustsFontSizeToFit
                    >
                      {leftBusiness === 'N/A'
                        ? 'N/A'
                        : `₹${formatToOneDecimal(leftBusiness)}`}
                    </Text>
                  </View>
                  <Text
                    style={[styles.businessLabel, { color: colors.text }]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    TOTAL LEFT BUSINESS
                  </Text>
                  <View
                    style={[
                      styles.networkBadge,
                      { backgroundColor: colors.lightBg },
                    ]}
                  >
                    <Icon name="people" size={12} color={colors.secondary} />
                    <Text
                      style={[
                        styles.networkBadgeText,
                        { color: colors.secondary },
                      ]}
                    >
                      Left Network
                    </Text>
                  </View>
                </View>

                {/* Right Business */}
                <View style={styles.childNode}>
                  <View
                    style={[
                      styles.businessCircle,
                      {
                        backgroundColor: colors.accent,
                        shadowColor: colors.shadow,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.businessAmount, { color: colors.white }]}
                      numberOfLines={2}
                      adjustsFontSizeToFit
                    >
                      {rightBusiness === 'N/A'
                        ? 'N/A'
                        : `₹${formatToOneDecimal(rightBusiness)}`}
                    </Text>
                  </View>
                  <Text
                    style={[styles.businessLabel, { color: colors.text }]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    TOTAL RIGHT BUSINESS
                  </Text>
                  <View
                    style={[
                      styles.networkBadge,
                      { backgroundColor: colors.lightBg },
                    ]}
                  >
                    <Icon name="people" size={12} color={colors.accent} />
                    <Text
                      style={[
                        styles.networkBadgeText,
                        { color: colors.accent },
                      ]}
                    >
                      Right Network
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Summary Info */}
            <View
              style={[
                styles.summaryContainer,
                { backgroundColor: colors.lightBg },
              ]}
            >
              <View style={styles.summaryRow}>
                <Text
                  style={[styles.summaryLabel, { color: colors.text }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  Total played amount:
                </Text>
                <View
                  style={[
                    styles.summaryBadge,
                    { backgroundColor: colors.secondary },
                  ]}
                >
                  <Text
                    style={[styles.summaryValue, { color: colors.white }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    ₹{formatToOneDecimal(totalPlayedAmount)}
                  </Text>
                </View>
              </View>
              <View style={styles.summaryRow}>
                <Text
                  style={[styles.summaryLabel, { color: colors.text }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  Total Bonus Received:
                </Text>
                <View
                  style={[
                    styles.summaryBadge,
                    { backgroundColor: colors.accent },
                  ]}
                >
                  <Text
                    style={[styles.summaryValue, { color: colors.white }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {earningsData
                      ? `₹${formatToOneDecimal(
                          earningsData.totalBonusReceivedTillDate || 0,
                        )}`
                      : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bonus History */}
          <View
            style={[styles.historyCard, { backgroundColor: colors.cardBg }]}
          >
            <View
              style={[
                styles.historyHeader,
                { backgroundColor: colors.primary },
              ]}
            >
              <View style={styles.historyHeaderTop}>
                <Icon name="history" size={20} color={colors.white} />
                <Text
                  style={[styles.historyHeaderTitle, { color: colors.white }]}
                >
                  Bonus History
                </Text>
              </View>

              {/* Date Search */}
              <View style={styles.searchContainer}>
                <View
                  style={[
                    styles.searchInputContainer,
                    { backgroundColor: colors.white },
                  ]}
                >
                  <Icon
                    name="date-range"
                    size={16}
                    color={colors.primary}
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search by date (DD/MM/YYYY)"
                    placeholderTextColor={colors.textSecondary}
                    value={dateSearch}
                    onChangeText={handleDateSearchChange}
                    keyboardType="numeric"
                  />
                  {dateSearch ? (
                    <TouchableOpacity
                      onPress={clearDateSearch}
                      style={styles.clearButton}
                    >
                      <Icon
                        name="close"
                        size={16}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </View>

            {/* History Table */}
            <View style={styles.tableContainer}>
              {/* Table Header */}
              <View
                style={[
                  styles.tableHeader,
                  { backgroundColor: colors.lightBg },
                ]}
              >
                <View style={styles.tableHeaderCell}>
                  <Icon name="calendar-today" size={14} color={colors.text} />
                  <Text
                    style={[styles.tableHeaderText, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    Date
                  </Text>
                </View>
                <View style={styles.tableHeaderCell}>
                  <Icon name="payments" size={14} color={colors.text} />
                  <Text
                    style={[styles.tableHeaderText, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    Bonus Received
                  </Text>
                </View>
              </View>

              {/* Table Body */}
              {filteredBonusHistory && filteredBonusHistory.length > 0 ? (
                filteredBonusHistory.map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.tableRow,
                      {
                        backgroundColor:
                          index % 2 === 0 ? colors.lightBg : colors.white,
                      },
                    ]}
                  >
                    <View style={styles.tableCell}>
                      <Icon
                        name="event-available"
                        size={14}
                        color={colors.primary}
                        style={styles.tableIcon}
                      />
                      <Text
                        style={[styles.tableCellText, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {item.date || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.tableCell}>
                      <View
                        style={[
                          styles.bonusBadge,
                          {
                            backgroundColor: colors.success + '15',
                            borderColor: colors.success + '55',
                          },
                        ]}
                      >
                        <Icon
                          name="currency-rupee"
                          size={12}
                          color={colors.success}
                        />
                        <Text
                          style={[
                            styles.bonusBadgeText,
                            { color: colors.success },
                          ]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                        >
                          {item.bonusReceived
                            ? `${formatToOneDecimal(item.bonusReceived)}`
                            : 'N/A'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Icon name="inbox" size={48} color={colors.border} />
                  <Text
                    style={[
                      styles.emptyStateText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {dateSearch
                      ? `No bonus history found for "${dateSearch}"`
                      : 'No bonus history available'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Bottom Spacing for Navigation */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Bottom Navigation */}
        <BottomNavigation activeTab="" />
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
    marginBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  errorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  header: {
    paddingVertical: 30,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 1,
  },
  noteCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  noteText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  userInfoMainContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  userInfoTopRow: {
    marginBottom: 12,
  },
  binaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    alignSelf: 'flex-start',
  },
  binaryButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  userInfoContainer: {
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  userProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInitial: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInitialText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  tokensContainer: {
    marginBottom: 16,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tokenLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    marginRight: 8,
    minWidth: 50,
  },
  tokenBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tokenValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  treeCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 15,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  treeHeader: {
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  treeHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  treeContent: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  rootNodeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  rootNode: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    borderWidth: 4,
    borderColor: '#ffffff',
    position: 'relative',
  },
  rootNodeText: {
    fontSize: 42,
    fontWeight: 'bold',
  },
  youBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    elevation: 2,
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  rootNodeName: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: 'bold',
    maxWidth: screenWidth * 0.8,
    textAlign: 'center',
  },
  connectingLines: {
    height: 80,
    position: 'relative',
    marginBottom: 16,
  },
  verticalLine: {
    position: 'absolute',
    left: '50%',
    marginLeft: -1.5,
    top: 0,
    width: 3,
    height: 40,
  },
  horizontalLine: {
    position: 'absolute',
    left: '25%',
    top: 40,
    width: '50%',
    height: 3,
  },
  leftVerticalLine: {
    position: 'absolute',
    left: '25%',
    marginLeft: -1.5,
    top: 40,
    width: 3,
    height: 40,
  },
  rightVerticalLine: {
    position: 'absolute',
    left: '75%',
    marginLeft: -1.5,
    top: 40,
    width: 3,
    height: 40,
  },
  childNodesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  childNode: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
    minWidth: 150,
    marginBottom: 16,
  },
  businessCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    paddingHorizontal: 8,
    borderWidth: 4,
    borderColor: '#ffffff',
    marginBottom: 12,
  },
  businessAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  businessLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 14,
    marginBottom: 8,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    elevation: 1,
  },
  networkBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  summaryContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  summaryBadge: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minWidth: 100,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  historyCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 15,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  historyHeader: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  historyHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  historyHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  searchContainer: {
    marginTop: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    height: 45,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
  },
  clearButton: {
    padding: 4,
  },
  tableContainer: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  tableHeaderCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableHeaderText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 4,
    marginLeft: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tableIcon: {
    marginRight: 4,
  },
  tableCellText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  bonusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 2,
  },
  bonusBadgeText: {
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  emptyStateContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    elevation: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  amountInput: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  availableText: {
    fontSize: 14,
    marginBottom: 8,
  },
  noteText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  previewContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#06b6d4',
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewColumn: {
    alignItems: 'center',
    flex: 1,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  previewSubtext: {
    fontSize: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  cancelButton: {
    // Styles are applied inline
  },
  transferButton: {
    // Styles are applied inline
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FriendsEarnings;
