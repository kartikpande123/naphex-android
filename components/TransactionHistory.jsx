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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from './ApiConfig';

const { width } = Dimensions.get('window');

const TransactionHistory = () => {
  const [userData, setUserData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [displayedTransactions, setDisplayedTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  // Filter states
  const [filterType, setFilterType] = useState('all'); // 'all', 'deposit', 'withdrawal'
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const TRANSACTIONS_PER_PAGE = 20;

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
      
      // Demo data for testing pagination
      const demoUserData = {
        name: 'Demo User',
        tokens: 1500,
        orders: generateDemoOrders(50),
        withdrawals: generateDemoWithdrawals(25)
      };
      setUserData(demoUserData);
      processTransactions(demoUserData);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Generate demo data for testing
  const generateDemoOrders = (count) => {
    const orders = {};
    for (let i = 1; i <= count; i++) {
      orders[`order_${i}`] = {
        type: i % 5 === 0 ? 'entry_fee' : 'deposit',
        amountPaid: Math.floor(Math.random() * 1000) + 100,
        creditedTokens: Math.floor(Math.random() * 500) + 50,
        processedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: ['paid', 'pending'][Math.floor(Math.random() * 2)],
        taxAmount: Math.floor(Math.random() * 50),
        taxRate: '18%'
      };
    }
    return orders;
  };

  const generateDemoWithdrawals = (count) => {
    const withdrawals = {};
    for (let i = 1; i <= count; i++) {
      withdrawals[`withdrawal_${i}`] = {
        requestedTokens: Math.floor(Math.random() * 500) + 100,
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: ['approved', 'pending', 'rejected'][Math.floor(Math.random() * 3)],
        tax: Math.floor(Math.random() * 30),
        method: {
          bankAccountNo: `****${Math.floor(Math.random() * 9999)}`
        }
      };
    }
    return withdrawals;
  };

  const processTransactions = (userData) => {
    const allTransactions = [];
    let runningBalance = 0;

    // Process deposits (orders) - these add to balance
    if (userData.orders) {
      Object.entries(userData.orders).forEach(([orderId, order]) => {
        // Check if this is an entry fee order
        const isEntryFee = order.type === 'entry_fee' || 
                          (order.paymentDetails?.order_meta?.order_note === 'Entry Fee') ||
                          (order.order_note === 'Entry Fee');
        
        // For entry fees, credit 200 tokens regardless of amount paid
        const creditedAmount = isEntryFee ? 200 : (order.creditedTokens || 0);
        runningBalance += creditedAmount;
        
        const transaction = {
          id: orderId,
          type: 'deposit',
          date: new Date(order.processedAt || Date.now()),
          amountRequested: order.amountPaid || 0,
          amountCredited: creditedAmount,
          tax: order.taxAmount || 0,
          taxRate: order.taxRate || '0%',
          status: order.status || 'pending',
          method: isEntryFee ? 'Entry Fee Payment' : 'Online Payment'
        };
        allTransactions.push(transaction);
      });
    }

    // Process withdrawals - these subtract from balance
    if (userData.withdrawals) {
      Object.entries(userData.withdrawals).forEach(([withdrawalId, withdrawal]) => {
        const transaction = {
          id: withdrawalId,
          type: 'withdrawal',
          date: new Date(withdrawal.createdAt || Date.now()),
          amountRequested: withdrawal.requestedTokens || 0,
          amountCredited: -(withdrawal.requestedTokens || 0),
          tax: withdrawal.tax || 0,
          taxRate: withdrawal.tax ? `${((withdrawal.tax / withdrawal.requestedTokens) * 100).toFixed(0)}%` : '0%',
          status: withdrawal.status || 'pending',
          method: withdrawal.method ? `Bank: ${withdrawal.method.bankAccountNo}` : 'Bank Transfer'
        };
        allTransactions.push(transaction);
      });
    }

    // Sort by date (newest first)
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    setTransactions(allTransactions);
    
    // Apply filters
    applyFilters(allTransactions);
  };

  const applyFilters = (transactionList = transactions) => {
    let filtered = [...transactionList];

    // Filter by transaction type
    if (filterType !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === filterType);
    }

    // Filter by date range
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
    
    // Reset pagination
    setCurrentPage(1);
    setDisplayedTransactions(filtered.slice(0, TRANSACTIONS_PER_PAGE));
  };

  const clearFilters = () => {
    setFilterType('all');
    setDateFrom('');
    setDateTo('');
    setFilteredTransactions(transactions);
    setCurrentPage(1);
    setDisplayedTransactions(transactions.slice(0, TRANSACTIONS_PER_PAGE));
  };

  const loadMoreTransactions = () => {
    const nextPage = currentPage + 1;
    const startIndex = 0;
    const endIndex = nextPage * TRANSACTIONS_PER_PAGE;
    
    setDisplayedTransactions(filteredTransactions.slice(startIndex, endIndex));
    setCurrentPage(nextPage);
  };

  const hasMoreTransactions = currentPage * TRANSACTIONS_PER_PAGE < filteredTransactions.length;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'approved':
      case 'completed':
        return '#10b981'; // Emerald green
      case 'rejected':
      case 'failed':
        return '#ef4444'; // Red
      case 'pending':
      default:
        return '#f59e0b'; // Amber
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'approved':
      case 'completed':
        return 'Success';
      case 'rejected':
      case 'failed':
        return 'Failed';
      case 'pending':
      default:
        return 'Pending';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
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
  }, [filterType, dateFrom, dateTo]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const onRefresh = () => {
    fetchUserData(true);
  };

  const renderTransactionItem = ({ item, index }) => (
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
          <Text style={styles.label}>Type:</Text>
          <View style={[
            styles.typeBadge,
            item.type === 'deposit' ? styles.depositBadge : styles.withdrawalBadge
          ]}>
            <Text style={[
              styles.typeText,
              item.type === 'deposit' ? styles.depositText : styles.withdrawalText
            ]}>
              {item.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
            </Text>
          </View>
        </View>

        <View style={styles.transactionRow}>
          <Text style={styles.label}>Amount Requested:</Text>
          <Text style={styles.amount}>₹{item.amountRequested}</Text>
        </View>

        <View style={styles.transactionRow}>
          <Text style={styles.label}>Amount Credited:</Text>
          <Text style={[
            styles.amount,
            item.amountCredited > 0 ? styles.positiveAmount : styles.negativeAmount
          ]}>
            {item.type === 'deposit' ? '+' : ''}{item.amountCredited} Tokens
          </Text>
        </View>

        <View style={styles.transactionRow}>
          <Text style={styles.label}>Tax:</Text>
          <Text style={styles.value}>₹{item.tax} ({item.taxRate})</Text>
        </View>

        <View style={styles.transactionRow}>
          <Text style={styles.label}>Method:</Text>
          <Text style={[styles.value, styles.method]} numberOfLines={2}>
            {item.method}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Transaction History</Text>
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
          <Text style={styles.loadingText}>Loading transaction history...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transaction History</Text>
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0D6EFD']}
            tintColor="#0D6EFD"
          />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Filters Section */}
        <View style={styles.filtersSection}>
          <Text style={styles.filtersTitle}>🔍 Filter Transactions</Text>
          
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Transaction Type</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  filterType === 'all' && styles.activeButton
                ]}
                onPress={() => setFilterType('all')}
              >
                <Text style={[
                  styles.typeButtonText,
                  filterType === 'all' && styles.activeButtonText
                ]}>
                  All
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  filterType === 'deposit' && styles.activeButton
                ]}
                onPress={() => setFilterType('deposit')}
              >
                <Text style={[
                  styles.typeButtonText,
                  filterType === 'deposit' && styles.activeButtonText
                ]}>
                  Deposits
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  filterType === 'withdrawal' && styles.activeButton
                ]}
                onPress={() => setFilterType('withdrawal')}
              >
                <Text style={[
                  styles.typeButtonText,
                  filterType === 'withdrawal' && styles.activeButtonText
                ]}>
                  Withdrawals
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

        <TouchableOpacity style={styles.refreshButton} onPress={() => fetchUserData()}>
          <Text style={styles.refreshButtonText}>🔄 Refresh Transactions</Text>
        </TouchableOpacity>

        {userData && (
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceText}>
              <Text style={styles.balanceBold}>Current Balance: {userData.tokens || 0} Tokens</Text>
              {userData.name && <Text> | User: {userData.name}</Text>}
            </Text>
          </View>
        )}

        {filteredTransactions.length > 0 && (
          <Text style={styles.transactionCount}>
            Showing {displayedTransactions.length} of {filteredTransactions.length} transactions
            {filteredTransactions.length !== transactions.length && 
              ` (filtered from ${transactions.length} total)`
            }
          </Text>
        )}

        {displayedTransactions.length > 0 ? (
          <>
            <FlatList
              data={displayedTransactions}
              renderItem={renderTransactionItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
            
            {hasMoreTransactions && (
              <TouchableOpacity style={styles.loadMoreButton} onPress={loadMoreTransactions}>
                <Text style={styles.loadMoreButtonText}>
                  Load More ({filteredTransactions.length - displayedTransactions.length} remaining)
                </Text>
              </TouchableOpacity>
            )}
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
            <Text style={styles.noDataText}>📊 No transactions found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#0D6EFD',
    paddingVertical: 30,
    paddingHorizontal: 20,
    paddingTop: 50, // Account for status bar
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
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
    padding: 16,
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
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    fontSize: 14,
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
  // New button styles replacing picker
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
  refreshButton: {
    backgroundColor: '#0D6EFD',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  balanceInfo: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  balanceText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#374151',
  },
  balanceBold: {
    fontWeight: '600',
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
  positiveAmount: {
    color: '#10b981',
  },
  negativeAmount: {
    color: '#ef4444',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  depositBadge: {
    backgroundColor: '#d1fae5',
  },
  withdrawalBadge: {
    backgroundColor: '#fee2e2',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  depositText: {
    color: '#10b981',
  },
  withdrawalText: {
    color: '#ef4444',
  },
  method: {
    fontSize: 12,
  },
  loadMoreButton: {
    backgroundColor: '#6b7280',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadMoreButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    color: '#6b7280',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
});

export default TransactionHistory;