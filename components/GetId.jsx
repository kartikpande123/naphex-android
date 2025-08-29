import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { EventSourcePolyfill } from 'event-source-polyfill';
import API_BASE_URL from './ApiConfig';

const GetId = ({ onReturn, navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [userResults, setUserResults] = useState([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [rejectedUsers, setRejectedUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = 5;
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Helper function to get the latest record by date
  const getLatestRecord = (records, dateField = 'createdAt') => {
    if (!records || records.length === 0) return null;
    if (records.length === 1) return records[0];
    
    return records.reduce((latest, current) => {
      const latestDate = new Date(latest[dateField] || latest.createdAt || latest.originalKycSubmittedAt || 0);
      const currentDate = new Date(current[dateField] || current.createdAt || current.originalKycSubmittedAt || 0);
      return currentDate > latestDate ? current : latest;
    });
  };

  // Helper function to find user by phone with latest record priority
  const findUserByPhoneNumber = (phoneNum) => {
    console.log('Searching for phone number:', phoneNum.trim());
    
    // Find matching user in main collection (active users)
    const mainUser = allUsers.find(u => 
      u.phoneNo && u.phoneNo.toString().includes(phoneNum.trim())
    );
    
    // Find all matching users in rejected collection and get the latest
    const rejectedMatches = rejectedUsers.filter(u => 
      u.phoneNo && u.phoneNo.toString().includes(phoneNum.trim())
    );
    
    const latestRejectedUser = getLatestRecord(rejectedMatches, 'rejectedAt');
    
    console.log('Main user found:', mainUser);
    console.log('Rejected matches:', rejectedMatches);
    console.log('Latest rejected user:', latestRejectedUser);
    
    // If user exists in main collection, they are active (not rejected)
    if (mainUser) {
      return { type: 'main', user: mainUser };
    }
    
    // If user only exists in rejected collection, show latest rejection
    if (latestRejectedUser) {
      return { type: 'rejected', user: latestRejectedUser };
    }
    
    // User not found anywhere
    return { type: 'not-found', user: null };
  };

  // Fetch users data as fallback
  const fetchUsersData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users-data`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setAllUsers(data.data);
        }
      }
    } catch (error) {
      // Silently handle error
    }
  };

  // Fetch rejected users data
  const fetchRejectedUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/rejected-requests`);
      if (response.ok) {
        const data = await response.json();
        setRejectedUsers(data);
      }
    } catch (error) {
      console.error('Error fetching rejected users:', error);
    }
  };

  // Setup SSE connection
  const setupSSEConnection = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    try {
      setConnectionStatus('connecting');
      
      const eventSource = new EventSourcePolyfill(`${API_BASE_URL}/api/users`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
        heartbeatTimeout: 60000,
        retry: 3000,
      });

      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setConnectionStatus('connected');
        setReconnectAttempts(0);
      };

      eventSource.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          if (response.success && response.data) {
            setAllUsers(response.data);
            setConnectionStatus('connected');
          }
        } catch (error) {
          // Silently handle parsing errors
        }
      };

      eventSource.onerror = (error) => {
        const isNetworkError = error.error && error.error.message && 
          (error.error.message.includes('No activity within') || 
           error.error.message.includes('Reconnecting'));
        
        if (isNetworkError) {
          setConnectionStatus('connecting');
          return;
        }
        
        setConnectionStatus('error');
        
        if (reconnectAttempts < maxReconnectAttempts && !isNetworkError) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            setupSSEConnection();
          }, timeout);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          setConnectionStatus('fallback');
          startHTTPPolling();
        }
      };

    } catch (error) {
      setConnectionStatus('fallback');
      startHTTPPolling();
    }
  };

  // HTTP polling as fallback
  const startHTTPPolling = () => {
    const pollInterval = setInterval(async () => {
      try {
        await fetchUsersData();
      } catch (error) {
        // Silently handle polling errors
      }
    }, 30000);

    eventSourceRef.current = { 
      close: () => clearInterval(pollInterval),
      readyState: 1
    };
  };

  // Initialize connections
  useEffect(() => {
    fetchRejectedUsers();
    setupSSEConnection();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const searchByPhoneNumber = () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    // Basic phone number validation
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber.trim())) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setUserResults([]);
    setSearchPerformed(false);

    console.log('Searching for phone number:', phoneNumber.trim());
    
    const result = findUserByPhoneNumber(phoneNumber);
    
    if (result.type === 'not-found') {
      // User not found anywhere
      setUserResults([]);
      setSearchPerformed(true);
      setLoading(false);
      Alert.alert(
        'User Not Found', 
        `No account found with phone number: ${phoneNumber.trim()}. Please check your phone number and try again.`
      );
      return;
    } else if (result.type === 'main') {
      // User found in main collection (active user)
      setUserResults([{ ...result.user, accountStatus: 'active' }]);
    } else if (result.type === 'rejected') {
      // User found in rejected collection (most recent is rejected)
      setUserResults([{ ...result.user, accountStatus: 'rejected' }]);
    }

    setSearchPerformed(true);
    setLoading(false);
  };

  const selectUserId = (user) => {
    const userId = user.userIds?.myuserid || user.userId;
    
    if (!userId) {
      Alert.alert('Error', 'User ID not found for this user');
      return;
    }

    const statusMessage = user.accountStatus === 'rejected' 
      ? '\n\nNote: This account was rejected. You can still use this ID to check status.'
      : '';

    Alert.alert(
      'Confirm Selection',
      `Do you want to use User ID: ${userId}?\n\nUser: ${user.name || user.userName || 'N/A'}${statusMessage}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Use This ID',
          onPress: () => onReturn(userId),
        },
      ]
    );
  };

  const handleGoBack = () => {
    onReturn(null);
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connecting': return '🔄 Connecting...';
      case 'connected': return '🟢 Live Data Active';
      case 'error': return '🔴 Connection Issue';
      case 'fallback': return '🟡 Backup Mode';
      default: return '⚪ Checking Connection';
    }
  };

  const refreshConnection = () => {
    setReconnectAttempts(0);
    setupSSEConnection();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Your User ID</Text>
        <Text style={styles.headerSubtitle}>
          Enter your phone number to find your User ID
        </Text>
        
        {/* Connection Status */}
        <View style={styles.connectionStatus}>
          <Text style={[styles.connectionText, { color: '#ffffff' }]}>
            {getConnectionStatusText()}
          </Text>
          {connectionStatus === 'error' && (
            <TouchableOpacity style={styles.retryButton} onPress={refreshConnection}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Card */}
      <View style={styles.searchCard}>
        <Text style={styles.inputLabel}>Enter Your Phone Number</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter 10-digit phone number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          maxLength={10}
          onSubmitEditing={searchByPhoneNumber}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={[styles.searchButton, loading && styles.disabledButton]}
          onPress={searchByPhoneNumber}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.buttonText}>Searching...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>🔍 Find User ID</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Results Section - Show users found */}
      {searchPerformed && userResults.length > 0 && (
        <View style={styles.resultsSection}>
          {userResults.map((user, index) => (
            <View key={index} style={styles.userCard}>
              <View style={styles.userInfo}>
                <View style={styles.userHeader}>
                  <Text style={styles.userName}>
                    {user.name || user.userName || 'N/A'}
                  </Text>
                  {user.accountStatus === 'rejected' && (
                    <View style={styles.rejectedBadge}>
                      <Text style={styles.rejectedBadgeText}>REJECTED</Text>
                    </View>
                  )}
                </View>
                
                <Text style={styles.userDetails}>
                  Phone: {user.phoneNo || phoneNumber}
                </Text>
                <Text style={styles.userDetails}>
                  City: {user.city || 'N/A'}
                </Text>
                <Text style={styles.userDetails}>
                  State: {user.state || 'N/A'}
                </Text>
                
                {/* Show rejection details if rejected */}
                {user.accountStatus === 'rejected' && (
                  <View style={styles.rejectionDetails}>
                    <Text style={styles.rejectionTitle}>Rejection Details:</Text>
                    <Text style={styles.rejectionText}>
                      Reason: {user.rejectionReason || 'N/A'}
                    </Text>
                    <Text style={styles.rejectionText}>
                      Rejected By: {user.rejectedBy || 'N/A'}
                    </Text>
                    <Text style={styles.rejectionText}>
                      Rejected At: {formatDate(user.rejectedAt)}
                    </Text>
                  </View>
                )}
                
                <View style={styles.userIdContainer}>
                  <Text style={styles.userIdLabel}>User ID:</Text>
                  <Text style={styles.userIdValue}>
                    {user.userIds?.myuserid || user.userId || 'N/A'}
                  </Text>
                </View>
                
                {/* Status badges - show KYC status for active accounts */}
                {user.accountStatus === 'active' && user.kycStatus && (
                  <View style={styles.badgesContainer}>
                    <View style={[
                      styles.statusBadge,
                      {
                        backgroundColor: user.kycStatus === 'accepted' ? '#28a745' :
                                       user.kycStatus === 'pending' ? '#ffc107' :
                                       user.kycStatus === 'submitted' ? '#17a2b8' : '#dc3545'
                      }
                    ]}>
                      <Text style={styles.statusBadgeText}>
                        KYC: {user.kycStatus.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
              
              <TouchableOpacity
                style={[
                  styles.selectButton,
                  user.accountStatus === 'rejected' && styles.selectButtonRejected
                ]}
                onPress={() => selectUserId(user)}
              >
                <Text style={styles.selectButtonText}>
                  Use This ID
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* No Results Message */}
      {searchPerformed && userResults.length === 0 && !loading && (
        <View style={styles.noResultsCard}>
          <Text style={styles.noResultsTitle}>🔍 No Users Found</Text>
          <Text style={styles.noResultsText}>
            No account found with the phone number: {phoneNumber}
          </Text>
          <Text style={styles.noResultsHint}>
            Please check your phone number and try again, or contact admin if you believe this is an error.
          </Text>
        </View>
      )}

      {/* Help Section */}
      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>Need Help?</Text>
        <Text style={styles.helpText}>
          • Make sure you enter the same phone number used during registration
        </Text>
        <Text style={styles.helpText}>
          • Enter only 10 digits without country code (+91)
        </Text>
        <Text style={styles.helpText}>
          • This searches through real-time data from the server
        </Text>
        <Text style={styles.helpText}>
          • Shows both active and rejected accounts (latest rejection if multiple)
        </Text>
        <Text style={styles.helpText}>
          • If you still can't find your account, contact admin for assistance
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  header: {
    backgroundColor: '#1976d2',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginTop: 20
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 12,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  searchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#e3f2fd',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  searchButton: {
    backgroundColor: '#1976d2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultsSection: {
    marginBottom: 20,
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  userInfo: {
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  rejectedBadge: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rejectedBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userDetails: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  rejectionDetails: {
    backgroundColor: '#fff5f5',
    borderColor: '#fed7d7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  rejectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#c53030',
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 12,
    color: '#e53e3e',
    marginBottom: 2,
  },
  userIdContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  userIdLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  userIdValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  selectButton: {
    backgroundColor: '#28a745',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  selectButtonRejected: {
    backgroundColor: '#ffc107',
  },
  selectButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  noResultsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6c757d',
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 8,
  },
  noResultsHint: {
    fontSize: 14,
    color: '#868e96',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  helpSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default GetId;