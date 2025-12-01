import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  FlatList,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from './ApiConfig';

const { width, height } = Dimensions.get('window');

const IngameTransaction = () => {
  const [userData, setUserData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  // Filter states
  const [filterTokenType, setFilterTokenType] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Helper function to format tokens to 2 decimal places
  const formatTokens = (tokens) => {
    return typeof tokens === 'number' ? tokens.toFixed(2) : parseFloat(tokens || 0).toFixed(2);
  };

  // Helper function to format currency to 2 decimal places
  const formatCurrency = (amount) => {
    return typeof amount === 'number' ? amount.toFixed(2) : parseFloat(amount || 0).toFixed(2);
  };

  // Get phone number from AsyncStorage
  const getUserPhoneNo = async () => {
    try {
      const userDataRaw = await AsyncStorage.getItem("userData");
      const userData = userDataRaw ? JSON.parse(userDataRaw) : null;
      return userData?.phoneNo || "";
    } catch (err) {
      console.log("AsyncStorage error, using demo phone number");
      return "7022852377";
    }
  };

  const fetchUserData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    setError('');
    
    try {
      const phoneNo = await getUserPhoneNo();
      
      if (!phoneNo) {
        setError('Phone number not found in user data');
        return;
      }
      
      // Make actual API call
      const response = await fetch(`${API_BASE_URL}/user-profile/json/${phoneNo}`);
      const data = await response.json();
      
      if (data.success) {
        setUserData(data.userData);
        processTransactions(data.userData);
      } else {
        setError(data.message || 'User not found');
      }
    } catch (err) {
      setError('Failed to fetch user data');
      console.error('API Error:', err);
      
      // Demo data for testing
      const demoUserData = {
        name: 'Demo User',
        tokens: 1500,
        binaryTokens: 500,
        wontokens: 300,
        binarytokensingame: generateDemoBinaryTransactions(15),
        wontokensingame: generateDemoWonTransactions(10)
      };
      setUserData(demoUserData);
      processTransactions(demoUserData);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Generate demo data for testing
  const generateDemoBinaryTransactions = (count) => {
    const transactions = {};
    for (let i = 1; i <= count; i++) {
      transactions[`binary_${i}`] = {
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        previousTokens: Math.floor(Math.random() * 1000) + 500,
        newTokens: Math.floor(Math.random() * 1000) + 500,
        previousBinaryTokens: Math.floor(Math.random() * 500) + 100,
        newBinaryTokens: Math.floor(Math.random() * 500) + 100,
        requestedAmount: Math.floor(Math.random() * 1000) + 100,
        tokensAdded: Math.floor(Math.random() * 200) + 50,
        taxDeducted: Math.floor(Math.random() * 50) + 10,
        taxPercentage: 23,
        status: ['completed', 'pending', 'failed'][Math.floor(Math.random() * 3)],
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      };
    }
    return transactions;
  };

  const generateDemoWonTransactions = (count) => {
    const transactions = {};
    for (let i = 1; i <= count; i++) {
      transactions[`won_${i}`] = {
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        previousTokens: Math.floor(Math.random() * 1000) + 500,
        newTokens: Math.floor(Math.random() * 1000) + 500,
        previousWonTokens: Math.floor(Math.random() * 300) + 50,
        newWonTokens: Math.floor(Math.random() * 300) + 50,
        requestedAmount: Math.floor(Math.random() * 500) + 50,
        tokensAdded: Math.floor(Math.random() * 100) + 25,
        taxDeducted: Math.floor(Math.random() * 30) + 5,
        taxPercentage: 30,
        status: ['completed', 'pending', 'failed'][Math.floor(Math.random() * 3)],
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      };
    }
    return transactions;
  };

  const processTransactions = (userData) => {
    const allTransactions = [];

    if (userData.binarytokensingame) {
      Object.entries(userData.binarytokensingame).forEach(([transactionId, transaction]) => {
        const transactionData = {
          id: transactionId,
          type: 'transfer_to_tokens',
          tokenType: 'binary',
          date: new Date(transaction.timestamp || transaction.date),
          previousTokens: transaction.previousTokens || 0,
          newTokens: transaction.newTokens || 0,
          previousBinaryTokens: transaction.previousBinaryTokens || 0,
          newBinaryTokens: transaction.newBinaryTokens || 0,
          requestedAmount: transaction.requestedAmount || 0,
          tokensAdded: transaction.tokensAdded || 0,
          taxDeducted: transaction.taxDeducted || 0,
          taxPercentage: transaction.taxPercentage || 0,
          status: transaction.status || 'completed',
          transactionDate: transaction.date
        };
        allTransactions.push(transactionData);
      });
    }

    if (userData.wontokensingame) {
      Object.entries(userData.wontokensingame).forEach(([transactionId, transaction]) => {
        const transactionData = {
          id: transactionId,
          type: 'transfer_to_tokens',
          tokenType: 'won',
          date: new Date(transaction.timestamp || transaction.date),
          previousTokens: transaction.previousTokens || 0,
          newTokens: transaction.newTokens || 0,
          previousWonTokens: transaction.previousWonTokens || 0,
          newWonTokens: transaction.newWonTokens || 0,
          requestedAmount: transaction.requestedAmount || 0,
          tokensAdded: transaction.tokensAdded || 0,
          taxDeducted: transaction.taxDeducted || 0,
          taxPercentage: transaction.taxPercentage || 0,
          status: transaction.status || 'completed',
          transactionDate: transaction.date
        };
        allTransactions.push(transactionData);
      });
    }

    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    setTransactions(allTransactions);
    setFilteredTransactions(allTransactions);
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    if (filterTokenType !== 'all') {
      filtered = filtered.filter(transaction => transaction.tokenType === filterTokenType);
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(transaction => transaction.date >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(transaction => transaction.date <= toDate);
    }

    setFilteredTransactions(filtered);
  };

  const clearFilters = () => {
    setFilterTokenType('all');
    setDateFrom('');
    setDateTo('');
    setFilteredTransactions(transactions);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'failed':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'Success';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const getTokenTypeStyle = (tokenType) => {
    switch (tokenType) {
      case 'binary':
        return {
          color: '#8b5cf6',
          backgroundColor: '#ede9fe',
          label: '⚡ Binary'
        };
      case 'won':
        return {
          color: '#10b981',
          backgroundColor: '#d1fae5',
          label: '🏆 Won'
        };
      default:
        return {
          color: '#6b7280',
          backgroundColor: '#f3f4f6',
          label: 'Unknown'
        };
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateForInput = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Set default date range (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    setDateTo(formatDateForInput(today));
    setDateFrom(formatDateForInput(thirtyDaysAgo));
  }, []);

  // Apply filters when filter values change
  useEffect(() => {
    if (transactions.length > 0) {
      applyFilters();
    }
  }, [filterTokenType, dateFrom, dateTo]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const onRefresh = () => {
    fetchUserData(true);
  };

  const renderTransactionItem = ({ item, index }) => {
    const tokenStyle = getTokenTypeStyle(item.tokenType);
    
    return (
      <View style={[styles.transactionCard, index % 2 === 1 && styles.evenCard]}>
        <View style={styles.transactionHeader}>
          <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) }
          ]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        
        <View style={styles.transactionBody}>
          <View style={styles.transactionRow}>
            <Text style={styles.label}>Token Type:</Text>
            <View style={[
              styles.tokenTypeBadge,
              { backgroundColor: tokenStyle.backgroundColor }
            ]}>
              <Text style={[styles.tokenTypeText, { color: tokenStyle.color }]}>
                {tokenStyle.label}
              </Text>
            </View>
          </View>

          <View style={styles.transactionRow}>
            <Text style={styles.label}>Requested Amount:</Text>
            <Text style={[styles.amount, styles.requestedAmount]}>
              ₹{formatCurrency(item.requestedAmount)}
            </Text>
          </View>

          <View style={styles.transactionRow}>
            <Text style={styles.label}>Tokens Added:</Text>
            <Text style={[styles.amount, styles.tokensAdded]}>
              +{formatTokens(item.tokensAdded)} Tokens
            </Text>
          </View>

          <View style={styles.transactionRow}>
            <Text style={styles.label}>Tax Deducted:</Text>
            <Text style={styles.value}>
              ₹{formatCurrency(item.taxDeducted)} ({item.taxPercentage}%)
            </Text>
          </View>

          {item.previousTokens !== undefined && (
            <View style={styles.transactionRow}>
              <Text style={styles.label}>Previous Balance:</Text>
              <Text style={styles.value}>{formatTokens(item.previousTokens)}</Text>
            </View>
          )}

          {item.newTokens !== undefined && (
            <View style={styles.transactionRow}>
              <Text style={styles.label}>New Balance:</Text>
              <Text style={[styles.value, styles.newBalance]}>
                {formatTokens(item.newTokens)}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>In-Game Transactions</Text>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
                <Text style={styles.legendText}>Success</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.legendText}>Pending</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} />
                <Text style={styles.legendText}>Failed</Text>
              </View>
            </View>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0D6EFD" />
            <Text style={styles.loadingText}>Loading in-game transactions...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>In-Game Transactions</Text>
          <Text style={styles.headerSubtitle}>
            Track your bonus tokens converted in Game tokens
          </Text>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
              <Text style={styles.legendText}>Success</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.legendText}>Pending</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.legendText}>Failed</Text>
            </View>
          </View>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0D6EFD']}
              tintColor="#0D6EFD"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ Error</Text>
              <Text style={styles.errorDescription}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchUserData}>
                <Text style={styles.retryButtonText}>🔄 Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* User Balance Summary */}
          {userData && (
            <View style={styles.balanceInfo}>
              <View style={styles.balanceGrid}>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceLabel}>💰 Regular Tokens</Text>
                  <Text style={[styles.balanceValue, { color: '#2d3748' }]}>
                    {formatTokens(userData.tokens || 0)}
                  </Text>
                </View>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceLabel}>⚡ Binary Tokens</Text>
                  <Text style={[styles.balanceValue, { color: '#0d6efd' }]}>
                    {formatTokens(userData.binaryTokens || 0)}
                  </Text>
                </View>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceLabel}>🏆 Won Tokens</Text>
                  <Text style={[styles.balanceValue, { color: '#198754' }]}>
                    {formatTokens(userData.wontokens || 0)}
                  </Text>
                </View>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceLabel}>📊 Total Transactions</Text>
                  <Text style={[styles.balanceValue, { color: '#0dcaf0' }]}>
                    {transactions.length}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Filters Section */}
          <View style={styles.filtersSection}>
            <Text style={styles.filtersTitle}>🔍 Filter Transactions</Text>
            
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Token Type</Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    filterTokenType === 'all' && styles.activeButton
                  ]}
                  onPress={() => setFilterTokenType('all')}
                >
                  <Text style={[
                    styles.typeButtonText,
                    filterTokenType === 'all' && styles.activeButtonText
                  ]}>
                    All Tokens
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    filterTokenType === 'binary' && styles.activeButton
                  ]}
                  onPress={() => setFilterTokenType('binary')}
                >
                  <Text style={[
                    styles.typeButtonText,
                    filterTokenType === 'binary' && styles.activeButtonText
                  ]}>
                    Binary
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    filterTokenType === 'won' && styles.activeButton
                  ]}
                  onPress={() => setFilterTokenType('won')}
                >
                  <Text style={[
                    styles.typeButtonText,
                    filterTokenType === 'won' && styles.activeButtonText
                  ]}>
                    Won
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>From Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.dateInput}
                value={dateFrom}
                onChangeText={setDateFrom}
                placeholder="2024-01-01"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>To Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.dateInput}
                value={dateTo}
                onChangeText={setDateTo}
                placeholder="2024-12-31"
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>🗑️ Clear Filters</Text>
            </TouchableOpacity>
          </View>

          {filteredTransactions.length > 0 && (
            <Text style={styles.transactionCount}>
              Showing {filteredTransactions.length} of {transactions.length} transactions
              {filteredTransactions.length !== transactions.length && 
                ` (filtered from ${transactions.length} total)`
              }
            </Text>
          )}

          {filteredTransactions.length > 0 ? (
            <>
              <FlatList
                data={filteredTransactions}
                renderItem={renderTransactionItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </>
          ) : transactions.length > 0 ? (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>🔍 No transactions found matching your filters</Text>
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataTitle}>📊 No transactions found</Text>
              <Text style={styles.noDataDescription}>
                You don't have any in-game transactions yet.
              </Text>
            </View>
          )}

          {/* Bottom padding to ensure content doesn't hide behind navigation */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D6EFD',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#0D6EFD',
    paddingVertical: 30,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 15,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorDescription: {
    color: '#dc2626',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  filtersSection: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#0D6EFD',
    borderColor: '#0D6EFD',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  activeButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#374151',
  },
  clearButton: {
    backgroundColor: '#6b7280',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  balanceInfo: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  balanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  balanceItem: {
    flex: 1,
    minWidth: width * 0.4,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  transactionCount: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#6b7280',
    fontSize: 14,
  },
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  evenCard: {
    backgroundColor: '#fafafa',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  transactionBody: {
    gap: 8,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  requestedAmount: {
    color: '#0d6efd',
  },
  tokensAdded: {
    color: '#10b981',
  },
  newBalance: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
  tokenTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tokenTypeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataTitle: {
    color: '#6b7280',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  noDataText: {
    color: '#6b7280',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  noDataDescription: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  bottomPadding: {
    height: 40,
  },
});

export default IngameTransaction;