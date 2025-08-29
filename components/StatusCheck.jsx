import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { EventSourcePolyfill } from 'event-source-polyfill';
import API_BASE_URL from './ApiConfig';
import GetId from './GetId'; // Import your GetId component

const { width } = Dimensions.get('window');

const StatusCheck = ({ navigation }) => {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusResult, setStatusResult] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [rejectedUsers, setRejectedUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [showGetId, setShowGetId] = useState(false); // State to control GetId component visibility
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

  // Helper function to find user by ID with latest record priority  
  const findUserById = (userIdToFind) => {
    console.log('Searching for userId:', userIdToFind.trim());
    
    // Find user in main collection by myuserid
    const mainUser = allUsers.find(u => 
      u.userIds && u.userIds.myuserid && u.userIds.myuserid === userIdToFind.trim()
    );
    
    // Find all matching users in rejected collection by userId and get the latest
    const rejectedMatches = rejectedUsers.filter(u => 
      u.userId === userIdToFind.trim()
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

  // Fetch rejected users data
  const fetchRejectedUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/rejected-requests`);
      if (response.ok) {
        const data = await response.json();
        console.log('Rejected users fetched:', data); // Debug log
        setRejectedUsers(data);
      }
    } catch (error) {
      console.error('Error fetching rejected users:', error);
    }
  };

  // Fetch users data as fallback
  const fetchUsersData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users-data`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          console.log('Users data fetched:', data.data.length, 'users'); // Debug log
          setAllUsers(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching users data:', error);
    }
  };

  // Setup SSE connection with better error handling
  const setupSSEConnection = () => {
    // Clear any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Clear any pending reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    try {
      setConnectionStatus('connecting');
      
      // Create new EventSource with custom configuration
      const eventSource = new EventSourcePolyfill(`${API_BASE_URL}/api/users`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
        heartbeatTimeout: 60000, // 60 seconds
        retry: 3000, // 3 seconds between retries
      });

      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        // Connection opened successfully
        setConnectionStatus('connected');
        setReconnectAttempts(0);
      };

      eventSource.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          if (response.success && response.data) {
            console.log('SSE data received:', response.data.length, 'users'); // Debug log
            setAllUsers(response.data);
            setConnectionStatus('connected');
          }
        } catch (error) {
          // Silently handle parsing errors - SSE might send keep-alive messages
        }
      };

      eventSource.onerror = (error) => {
        // Handle different types of errors more gracefully
        const isNetworkError = error.error && error.error.message && 
          (error.error.message.includes('No activity within') || 
           error.error.message.includes('Reconnecting'));
        
        if (isNetworkError) {
          // This is a normal reconnection, don't show as error to user
          setConnectionStatus('connecting');
          return;
        }
        
        // Only set error status for actual connection failures
        setConnectionStatus('error');
        
        // Handle reconnection logic only for real errors
        if (reconnectAttempts < maxReconnectAttempts && !isNetworkError) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            setupSSEConnection();
          }, timeout);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          // Only fallback after actual connection failures
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
    }, 30000); // Poll every 30 seconds

    // Store interval ID for cleanup
    eventSourceRef.current = { 
      close: () => clearInterval(pollInterval),
      readyState: 1 // Mock readyState for compatibility
    };
  };

  // Initialize connections
  useEffect(() => {
    fetchRejectedUsers();
    
    // Try SSE first, fallback to HTTP if needed
    setupSSEConnection();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Handle app state changes (optional - for React Native)
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active' && connectionStatus === 'error') {
        // Reconnect when app becomes active
        setupSSEConnection();
      } else if (nextAppState === 'background') {
        // Close connection when app goes to background
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
      }
    };

    // Note: You'll need to import AppState from 'react-native' and add listener
    // AppState.addEventListener('change', handleAppStateChange);
    // return () => AppState.removeEventListener('change', handleAppStateChange);
  }, [connectionStatus]);

  const checkAccountStatus = () => {
    if (!userId.trim()) {
      setStatusResult({
        type: 'error',
        message: 'Please enter a valid User ID'
      });
      return;
    }

    setLoading(true);
    
    console.log('Searching for userId:', userId.trim());
    
    const result = findUserById(userId);
    
    if (result.type === 'not-found') {
      // User not found anywhere
      setStatusResult({
        type: 'not-found',
        title: '🔍 User Not Found',
        message: `No account found with User ID: ${userId.trim()}. Please check your User ID and try again, or contact admin if you believe this is an error.`
      });
    } else if (result.type === 'rejected') {
      // Most recent record is rejected
      setStatusResult({
        type: 'rejected',
        title: '❌ Account Rejected',
        message: 'Your most recent account/KYC verification has been rejected by admin.',
        rejectionReason: result.user.rejectionReason,
        rejectedAt: result.user.rejectedAt,
        rejectedBy: result.user.rejectedBy,
        user: result.user
      });
    } else if (result.type === 'main') {
      // User found in main collection - check KYC status
      const user = result.user;
      console.log('User found - checking KYC status:', user);
      
      if (user.kycStatus) {
        // User has KYC data - check status
        if (user.kycStatus === 'accepted') {
          setStatusResult({
            type: 'success',
            title: '✅ KYC Verification Completed Successfully',
            message: 'Your KYC verification is completed successfully. You can now login and pay registration fees to activate your account.',
            user: user
          });
        } else if (user.kycStatus === 'submitted') {
          setStatusResult({
            type: 'pending',
            title: '⏳ KYC Verification Pending',
            message: 'Your KYC verification is pending. Please wait for 24 hours or contact admin for more information.',
            user: user
          });
        } else if (user.kycStatus === 'rejected') {
          setStatusResult({
            type: 'rejected',
            title: '❌ KYC Verification Rejected',
            message: 'Your KYC verification has been rejected. Please contact admin for more information or resubmit your documents.',
            user: user
          });
        } else {
          // Unknown KYC status
          setStatusResult({
            type: 'warning',
            title: '📋 KYC Status Unknown',
            message: `Your KYC status is unclear (Status: ${user.kycStatus}). Please contact admin for assistance.`,
            user: user
          });
        }
      } else {
        // User exists but no KYC data submitted yet
        setStatusResult({
          type: 'warning',
          title: '📋 No KYC Submitted',
          message: 'Your account exists but no KYC verification has been submitted yet. Please submit your KYC documents to proceed.',
          user: user
        });
      }
    }
    
    setLoading(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (type) => {
    switch (type) {
      case 'success': return '#28a745';
      case 'pending': return '#ffc107';
      case 'rejected': return '#dc3545';
      case 'warning': return '#17a2b8';
      case 'not-found': return '#6c757d';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusBgColor = (type) => {
    switch (type) {
      case 'success': return '#d4edda';
      case 'pending': return '#fff3cd';
      case 'rejected': return '#f8d7da';
      case 'warning': return '#d1ecf1';
      case 'not-found': return '#e2e3e5';
      case 'error': return '#f8d7da';
      default: return '#e2e3e5';
    }
  };

  const resetStatus = () => {
    setStatusResult(null);
    setUserId('');
  };

  const navigateToHelp = () => {
    navigation?.navigate('Help');
  };

  const navigateToLogin = () => {
    navigation?.navigate('Login');
  };

  const refreshConnection = () => {
    setReconnectAttempts(0);
    setupSSEConnection();
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connecting': return '🔄 Connecting...';
      case 'connected': return '🟢 Live Updates Active';
      case 'error': return '🔴 Connection Issue';
      case 'fallback': return '🟡 Backup Mode Active';
      default: return '⚪ Checking Connection';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#28a745';
      case 'connecting': return '#ffc107';
      case 'error': return '#dc3545';
      case 'fallback': return '#fd7e14';
      default: return '#6c757d';
    }
  };

  const handleGetIdReturn = (selectedUserId) => {
    if (selectedUserId) {
      setUserId(selectedUserId);
    }
    setShowGetId(false);
  };

  // If GetId component should be shown, render it instead
  if (showGetId) {
    return (
      <GetId 
        onReturn={handleGetIdReturn}
        navigation={navigation}
      />
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account Status Checker</Text>
        <Text style={styles.headerSubtitle}>
          Check your KYC verification and account approval status
        </Text>
      </View>

      {/* Get User ID Button */}
      <View style={styles.getUserIdSection}>
        <TouchableOpacity
          style={styles.getUserIdButton}
          onPress={() => setShowGetId(true)}
        >
          <Text style={styles.getUserIdButtonText}>Get User ID</Text>
        </TouchableOpacity>
        <Text style={styles.getUserIdHint}>
          Don't know your User ID? Click above to find it using your phone number
        </Text>
      </View>

      {/* Search Card */}
      <View style={styles.searchCard}>
        <Text style={styles.inputLabel}>Enter Your User ID</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., USERQMZY7NECD"
          value={userId}
          onChangeText={setUserId}
          onSubmitEditing={checkAccountStatus}
          autoCapitalize="characters"
          returnKeyType="search"
        />
        <TouchableOpacity
          style={[styles.searchButton, loading && styles.disabledButton]}
          onPress={checkAccountStatus}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.buttonText}>Checking...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>🔍 Check Status</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Results Card */}
      {statusResult && (
        <View style={[styles.resultCard, { borderColor: getStatusColor(statusResult.type) }]}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>{statusResult.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(statusResult.type) }]}>
              <Text style={styles.statusBadgeText}>
                {statusResult.type.toUpperCase().replace('-', ' ')}
              </Text>
            </View>
          </View>
          
          <Text style={styles.resultMessage}>{statusResult.message}</Text>

          {/* Rejection Details */}
          {statusResult.type === 'rejected' && statusResult.rejectionReason && (
            <View style={styles.rejectionAlert}>
              <Text style={styles.rejectionTitle}>⚠️ Rejection Details</Text>
              <Text style={styles.rejectionText}>
                <Text style={styles.bold}>Reason:</Text> {statusResult.rejectionReason}
              </Text>
              {statusResult.rejectedBy && (
                <Text style={styles.rejectionText}>
                  <Text style={styles.bold}>Rejected By:</Text> {statusResult.rejectedBy}
                </Text>
              )}
              {statusResult.rejectedAt && (
                <Text style={styles.rejectionText}>
                  <Text style={styles.bold}>Rejected At:</Text> {formatDate(statusResult.rejectedAt)}
                </Text>
              )}
            </View>
          )}

          {/* User Details - Only Name and Phone Number */}
          {statusResult.user && (
            <View style={styles.userDetails}>
              <Text style={styles.userDetailsTitle}>Account Information</Text>
              <View style={styles.userInfoGrid}>
                <View style={styles.userInfoItem}>
                  <Text style={styles.userInfoLabel}>User Name</Text>
                  <Text style={styles.userInfoValue}>
                    {statusResult.user.name || statusResult.user.userName || 'N/A'}
                  </Text>
                </View>
                <View style={styles.userInfoItem}>
                  <Text style={styles.userInfoLabel}>Phone Number</Text>
                  <Text style={styles.userInfoValue}>{statusResult.user.phoneNo || 'N/A'}</Text>
                </View>
                {statusResult.user.kycAcceptedAt && (
                  <View style={[styles.userInfoItem, styles.successInfoItem, styles.fullWidth]}>
                    <Text style={[styles.userInfoLabel, styles.successText]}>KYC Accepted At</Text>
                    <Text style={[styles.userInfoValue, styles.successText]}>
                      {formatDate(statusResult.user.kycAcceptedAt)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryButton} onPress={resetStatus}>
              <Text style={styles.primaryButtonText}>Check Another Account</Text>
            </TouchableOpacity>
            
            {(statusResult.type === 'rejected' || statusResult.type === 'pending' || statusResult.type === 'warning') && (
              <TouchableOpacity style={styles.infoButton} onPress={navigateToHelp}>
                <Text style={styles.infoButtonText}>Contact Admin</Text>
              </TouchableOpacity>
            )}
            
            {statusResult.type === 'success' && (
              <TouchableOpacity style={styles.successButton} onPress={navigateToLogin}>
                <Text style={styles.successButtonText}>Login & Pay Registration</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
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
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginTop: 20
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
  debugInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
  },
  debugText: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: 2,
  },
  getUserIdSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  getUserIdButton: {
    backgroundColor: '#1976d2',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  getUserIdButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  getUserIdHint: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
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
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  resultMessage: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 24,
  },
  rejectionAlert: {
    backgroundColor: '#f8d7da',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  rejectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#721c24',
    marginBottom: 8,
  },
  rejectionText: {
    fontSize: 14,
    color: '#721c24',
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
  },
  userDetails: {
    marginTop: 16,
  },
  userDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  userInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  userInfoItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    width: '48%',
  },
  successInfoItem: {
    backgroundColor: '#d4edda',
    borderWidth: 1,
    borderColor: '#28a745',
  },
  fullWidth: {
    width: '100%',
  },
  userInfoLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  userInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  successText: {
    color: '#155724',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: '#007bff',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    minWidth: 120,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoButton: {
    backgroundColor: '#17a2b8',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    minWidth: 120,
    alignItems: 'center',
  },
  infoButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  successButton: {
    backgroundColor: '#28a745',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    minWidth: 120,
    alignItems: 'center',
  },
  successButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default StatusCheck;