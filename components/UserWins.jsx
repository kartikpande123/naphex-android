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

export default function UserWins() {
  const [wins, setWins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 My Wins</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
                      <Text style={styles.betAmount}>₹{win.betAmount}</Text>
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
                        <Text style={styles.amountWon}>₹{win.amountWon}</Text>
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
    paddingVertical: 40,
    paddingHorizontal: 20,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: -0.5
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
  }
});