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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import API_BASE_URL from './ApiConfig';
import BottomNavigation from './BottomNavigation'; // Added import

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

  // Color scheme - Professional mobile colors
  const colors = {
    primary: '#1e88e5',
    secondary: '#5e35b1',
    accent: '#00acc1',
    lightBg: '#f8fafc',
    cardBg: '#ffffff',
    text: '#263238',
    textSecondary: '#64748b',
    white: '#ffffff',
    note: '#f59e0b',
    success: '#10b981',
    error: '#ef4444',
    border: '#e2e8f0',
    shadow: 'rgba(0, 0, 0, 0.1)',
  };

  // Function to sort bonus history by date (newest first)
  const sortBonusHistoryByDate = (history) => {
    return history.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      
      const parseDate = (dateStr) => {
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
      formattedSearch = formattedSearch.substring(0, 2) + '/' + formattedSearch.substring(2);
    }
    if (formattedSearch.length >= 5) {
      formattedSearch = formattedSearch.substring(0, 5) + '/' + formattedSearch.substring(5, 9);
    }

    return history.filter(item => {
      if (!item.date) return false;
      
      let itemDateFormatted = item.date;
      
      if (item.date.includes('-')) {
        const parts = item.date.split('-');
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            itemDateFormatted = `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
          } else {
            itemDateFormatted = `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
          }
        }
      }
      
      return itemDateFormatted.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
             itemDateFormatted.replace(/\//g, '').startsWith(searchTerm.replace(/\//g, ''));
    });
  };

  // Handle date search input change
  const handleDateSearchChange = (value) => {
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

      const profileResponse = await axios.get(`${API_BASE_URL}/user-profile/${storedUserData.phoneNo}`);
      const profileData = JSON.parse(profileResponse.data.replace('data: ', ''));

      if (profileData.success) {
        setUserData(profileData.userData);
        
        const totalPlayed = profileData.userData?.game1?.['total-bet-amount']?.totalAmount || 0;
        setTotalPlayedAmount(totalPlayed);
      }

      const userId = storedUserData?.userids?.myuserid;
      if (!userId) {
        throw new Error('User ID not found');
      }

      // Fetch latest earnings data
      const earningsResponse = await axios.get(`${API_BASE_URL}/latest`, {
        params: { userId }
      });

      if (earningsResponse.data.success) {
        setEarningsData(earningsResponse.data.data);
        setShowFullUI(true);
      } else {
        throw new Error(earningsResponse.data.message || 'Failed to fetch earnings data');
      }

      // Fetch bonus history data
      const historyResponse = await axios.get(`${API_BASE_URL}/userDailyEarnings`, {
        params: { userId }
      });

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
      if (err.response?.status === 404 || err.message.includes('404') || err.message.includes('Failed to fetch')) {
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
  const getNameInitial = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
      </View>
    );
  }

  if (error && !showFullUI) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar backgroundColor={colors.error} barStyle="light-content" />
        <View style={[styles.errorCard, { backgroundColor: colors.cardBg, borderColor: colors.error }]}>
          <Icon name="error" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>Error: {error}</Text>
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
          <View style={[styles.noteCard, { backgroundColor: colors.cardBg, borderColor: colors.note }]}>
            <Icon name="info" size={20} color={colors.note} />
            <Text style={[styles.noteText, { color: colors.text }]}>
              Note: The earnings data displayed reflects only the most recent day's earnings and gets refreshed every day.
            </Text>
          </View>

          {/* User Info and Binary Tree Button */}
          <View style={styles.userInfoContainer}>
            <TouchableOpacity 
              onPress={navigateToBinaryTree}
              style={[styles.binaryButton, { 
                backgroundColor: colors.secondary,
                shadowColor: colors.shadow 
              }]}
              activeOpacity={0.8}
            >
              <Icon name="account-tree" size={20} color={colors.white} />
              <Text style={[styles.binaryButtonText, { color: colors.white }]}>
                See Binary Tree
              </Text>
            </TouchableOpacity>
            
            <View style={[styles.userInfo, { backgroundColor: colors.accent }]}>
              <Icon name="monetization-on" size={16} color={colors.white} />
              <Text style={[styles.userInfoText, { color: colors.white }]} numberOfLines={1}>
                Tokens: {userData?.tokens || 0}
              </Text>
            </View>
          </View>

          {/* Bonus Tree Structure */}
          <View style={[styles.treeCard, { backgroundColor: colors.cardBg }]}>
            <View style={[styles.treeHeader, { backgroundColor: colors.primary }]}>
              <Text style={[styles.treeHeaderTitle, { color: colors.white }]}>
                Bonus Structure
              </Text>
            </View>
            
            <View style={styles.treeContent}>
              {/* Root Node */}
              <View style={styles.rootNodeContainer}>
                <View style={[styles.rootNode, { 
                  backgroundColor: colors.accent,
                  shadowColor: colors.shadow 
                }]}>
                  <Text style={[styles.rootNodeText, { color: colors.white }]}>
                    {userInitial}
                  </Text>
                </View>
                <Text style={[styles.rootNodeName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                  {userData?.name || 'User'}
                </Text>
              </View>
              
              {/* Connecting Lines */}
              <View style={styles.connectingLines}>
                <View style={[styles.verticalLine, { backgroundColor: colors.primary }]} />
                <View style={[styles.horizontalLine, { backgroundColor: colors.primary }]} />
                <View style={[styles.leftVerticalLine, { backgroundColor: colors.primary }]} />
                <View style={[styles.rightVerticalLine, { backgroundColor: colors.primary }]} />
              </View>
              
              {/* Child Nodes */}
              <View style={styles.childNodesContainer}>
                {/* Left Business */}
                <View style={styles.childNode}>
                  <View style={[styles.businessCircle, { 
                    backgroundColor: colors.secondary,
                    shadowColor: colors.shadow 
                  }]}>
                    <Text style={[styles.businessAmount, { color: colors.white }]} numberOfLines={2} adjustsFontSizeToFit>
                      {leftBusiness === 'N/A' ? 'N/A' : `₹${leftBusiness}`}
                    </Text>
                  </View>
                  <Text style={[styles.businessLabel, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">
                    TOTAL LEFT BUSINESS
                  </Text>
                </View>
                
                {/* Right Business */}
                <View style={styles.childNode}>
                  <View style={[styles.businessCircle, { 
                    backgroundColor: colors.accent,
                    shadowColor: colors.shadow 
                  }]}>
                    <Text style={[styles.businessAmount, { color: colors.white }]} numberOfLines={2} adjustsFontSizeToFit>
                      {rightBusiness === 'N/A' ? 'N/A' : `₹${rightBusiness}`}
                    </Text>
                  </View>
                  <Text style={[styles.businessLabel, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">
                    TOTAL RIGHT BUSINESS
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Summary Info */}
            <View style={[styles.summaryContainer, { backgroundColor: colors.lightBg }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
                  Total played amount:
                </Text>
                <View style={[styles.summaryBadge, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.summaryValue, { color: colors.white }]} numberOfLines={1} adjustsFontSizeToFit>
                    ₹{totalPlayedAmount}
                  </Text>
                </View>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
                  Total Bonus After Tax:
                </Text>
                <View style={[styles.summaryBadge, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.summaryValue, { color: colors.white }]} numberOfLines={1} adjustsFontSizeToFit>
                    {earningsData ? `₹${earningsData.totalBonusReceivedTillDate || 0}` : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bonus History */}
          <View style={[styles.historyCard, { backgroundColor: colors.cardBg }]}>
            <View style={[styles.historyHeader, { backgroundColor: colors.primary }]}>
              <Text style={[styles.historyHeaderTitle, { color: colors.white }]}>
                Bonus History
              </Text>
              
              {/* Date Search */}
              <View style={styles.searchContainer}>
                <View style={[styles.searchInputContainer, { backgroundColor: colors.white }]}>
                  <Icon name="date-range" size={16} color={colors.primary} style={styles.searchIcon} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor={colors.textSecondary}
                    value={dateSearch}
                    onChangeText={handleDateSearchChange}
                    keyboardType="numeric"
                  />
                  {dateSearch ? (
                    <TouchableOpacity onPress={clearDateSearch} style={styles.clearButton}>
                      <Icon name="close" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </View>
            
            {/* History Table */}
            <View style={styles.tableContainer}>
              {/* Table Header */}
              <View style={[styles.tableHeader, { backgroundColor: colors.lightBg }]}>
                <Text style={[styles.tableHeaderText, { color: colors.text }]} numberOfLines={1}>Date</Text>
                <Text style={[styles.tableHeaderText, { color: colors.text }]} numberOfLines={2}>Tax Deducted</Text>
                <Text style={[styles.tableHeaderText, { color: colors.text }]} numberOfLines={2}>Bonus after Tax</Text>
              </View>
              
              {/* Table Body */}
              {filteredBonusHistory && filteredBonusHistory.length > 0 ? (
                filteredBonusHistory.map((item, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.tableRow, 
                      { backgroundColor: index % 2 === 0 ? colors.lightBg : colors.white }
                    ]}
                  >
                    <Text style={[styles.tableCellText, { color: colors.text }]} numberOfLines={1}>
                      {item.date || 'N/A'}
                    </Text>
                    <View style={[styles.tableBadge, { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.tableBadgeText, { color: colors.white }]} numberOfLines={1} adjustsFontSizeToFit>
                        {item.taxDeducted ? `₹${item.taxDeducted}` : 'N/A'}
                      </Text>
                    </View>
                    <View style={[styles.tableBadge, { backgroundColor: colors.accent }]}>
                      <Text style={[styles.tableBadgeText, { color: colors.white }]} numberOfLines={1} adjustsFontSizeToFit>
                        {item.bonusAfterTax ? `₹${item.bonusAfterTax}` : 'N/A'}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Icon name="info" size={24} color={colors.textSecondary} />
                  <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                    {dateSearch ? 
                      `No bonus history found for "${dateSearch}"` : 
                      'No bonus history available'
                    }
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
    marginBottom: 80, // Space for bottom navigation
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
    marginTop:10
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
  userInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
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
  },
  binaryButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  userInfoText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginHorizontal: 3,
    flexShrink: 1,
  },
  userInfoSeparator: {
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 6,
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
  },
  treeHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  rootNodeText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  rootNodeName: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: 'bold',
    maxWidth: screenWidth * 0.8,
    textAlign: 'center',
  },
  connectingLines: {
    height: 50,
    position: 'relative',
    marginBottom: 16,
  },
  verticalLine: {
    position: 'absolute',
    left: '50%',
    marginLeft: -1,
    top: 0,
    width: 2,
    height: 25,
  },
  horizontalLine: {
    position: 'absolute',
    left: '25%',
    top: 25,
    width: '50%',
    height: 2,
  },
  leftVerticalLine: {
    position: 'absolute',
    left: '25%',
    marginLeft: -1,
    top: 25,
    width: 2,
    height: 25,
  },
  rightVerticalLine: {
    position: 'absolute',
    left: '75%',
    marginLeft: -1,
    top: 25,
    width: 2,
    height: 25,
  },
  childNodesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  childNode: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  businessCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    paddingHorizontal: 8,
  },
  businessAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  businessLabel: {
    marginTop: 12,
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 14,
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
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  summaryBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minWidth: 80,
  },
  summaryValue: {
    fontSize: 13,
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
  historyHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
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
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#1e88e5',
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableCellText: {
    flex: 1,
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  tableBadge: {
    flex: 1,
    marginHorizontal: 2,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tableBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
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
});

export default FriendsEarnings;