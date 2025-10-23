import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from './ApiConfig';

const { width } = Dimensions.get('window');

export default function UserTokenRequest() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [phoneNo, setPhoneNo] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataRaw = await AsyncStorage.getItem('userData');
      const userData = userDataRaw ? JSON.parse(userDataRaw) : null;
      const phoneNumber = userData?.phoneNo || '';
      setPhoneNo(phoneNumber);

      if (phoneNumber) {
        await fetchUserData(phoneNumber);
      } else {
        setError('No phone number found');
        setLoading(false);
      }
    } catch (err) {
      setError('Error loading user data: ' + err.message);
      setLoading(false);
    }
  };

  const fetchUserData = async (phoneNumber) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/user-profile/json/${phoneNumber}`
      );
      const data = await response.json();

      if (data.success) {
        setUserData(data.userData);
      } else {
        setError(data.message || 'User not found');
      }
    } catch (err) {
      setError('Error fetching user data: ' + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (phoneNo) {
      fetchUserData(phoneNo);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return { date: 'N/A', time: '' };
    const dateObj = new Date(dateString);
    const date = dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const time = dateObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return { date, time };
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return '#28a745';
      case 'rejected':
        return '#dc3545';
      case 'pending':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  const getTokenRequestHistory = () => {
    if (!userData?.tokenRequestHistory) return [];

    return Object.entries(userData.tokenRequestHistory)
      .map(([key, value]) => ({
        id: key,
        ...value
      }))
      .sort(
        (a, b) =>
          new Date(b.submittedDate || b.submittedAt) -
          new Date(a.submittedDate || a.submittedAt)
      );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading token requests...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  const tokenRequests = getTokenRequestHistory();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🪙 Token Request History</Text>
          <Text style={styles.headerSubtitle}>
            Overview of all your token purchase requests
          </Text>
        </View>
        <View style={styles.phoneBadge}>
          <Text style={styles.phoneBadgeText}>📞 {phoneNo}</Text>
        </View>
      </View>

      {/* Summary Cards */}
      {tokenRequests.length > 0 && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryNumber, { color: '#007bff' }]}>
                {tokenRequests.length}
              </Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={[styles.summaryNumber, { color: '#28a745' }]}>
                {tokenRequests.filter((req) => req.status === 'approved').length}
              </Text>
              <Text style={styles.summaryLabel}>Approved</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryNumber, { color: '#dc3545' }]}>
                {tokenRequests.filter((req) => req.status === 'rejected').length}
              </Text>
              <Text style={styles.summaryLabel}>Rejected</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={[styles.summaryNumber, { color: '#ffc107' }]}>
                {
                  tokenRequests.filter(
                    (req) => !['approved', 'rejected'].includes(req.status)
                  ).length
                }
              </Text>
              <Text style={styles.summaryLabel}>Pending</Text>
            </View>
          </View>
        </View>
      )}

      {/* Token Requests List */}
      <View style={styles.requestsContainer}>
        {tokenRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No Token Requests Found</Text>
            <Text style={styles.emptyText}>
              You haven't made any token requests yet.
            </Text>
          </View>
        ) : (
          tokenRequests.map((request) => {
            const dateTime = formatDate(request.submittedDate);
            return (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View>
                    <Text style={styles.dateLabel}>Date</Text>
                    <Text style={styles.dateText}>{dateTime.date}</Text>
                    {dateTime.time && (
                      <Text style={styles.timeText}>{dateTime.time}</Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(request.status) }
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {request.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.tokenInfo}>
                  <View style={styles.tokenItem}>
                    <Text style={styles.tokenLabel}>Total Paid</Text>
                    <Text style={styles.tokenValue}>
                      {request.requestedTokens?.toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.tokenItem}>
                    <Text style={styles.tokenLabel}>Net Tokens</Text>
                    <Text style={[styles.tokenValue, { color: '#28a745' }]}>
                      {request.netTokens?.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {request.rejectionReason && (
                  <>
                    <View style={styles.divider} />
                    <View>
                      <Text style={styles.rejectionLabel}>Rejection Reason</Text>
                      <Text style={styles.rejectionText}>
                        {request.rejectionReason}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  contentContainer: {
    padding: 16
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d'
  },
  errorCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
    maxWidth: 400,
    width: '100%'
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 8
  },
  errorText: {
    fontSize: 14,
    color: '#6c757d'
  },
  headerCard: {
    backgroundColor: '#2563eb',
    padding: 20,
    borderRadius: 8,
    marginBottom: 16
  },
  headerContent: {
    marginBottom: 12
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)'
  },
  phoneBadge: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start'
  },
  phoneBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  summaryContainer: {
    marginBottom: 16
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 12
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    marginHorizontal: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6c757d'
  },
  requestsContainer: {
    marginBottom: 16
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 8,
    alignItems: 'center'
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center'
  },
  requestCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  dateLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2
  },
  timeText: {
    fontSize: 13,
    color: '#6c757d'
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff'
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 12
  },
  tokenInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  tokenItem: {
    flex: 1
  },
  tokenLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4
  },
  tokenValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007bff'
  },
  rejectionLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4
  },
  rejectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc3545'
  }
});