import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import API_BASE_URL from './ApiConfig';
import BottomNavigation from './BottomNavigation';

const { width } = Dimensions.get('window');

const UserGameHistory = () => {
  const [userData, setUserData] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    phoneNo: null,
    connectionStatus: 'Not connected',
    lastEvent: null,
    lastError: null
  });

  // Helper function to format tokens to 2 decimal places
  const formatTokens = (tokens) => {
    return typeof tokens === 'number' ? tokens.toFixed(2) : parseFloat(tokens || 0).toFixed(2);
  };

  // Helper function to format currency to 2 decimal places
  const formatCurrency = (amount) => {
    return typeof amount === 'number' ? amount.toFixed(2) : parseFloat(amount || 0).toFixed(2);
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Get phoneNo from AsyncStorage
        const storedUserData = await AsyncStorage.getItem("userData");
        const parsedUserData = storedUserData ? JSON.parse(storedUserData) : null;
        
        setDebugInfo(prev => ({
          ...prev,
          phoneNo: parsedUserData?.phoneNo || 'Not found'
        }));
        
        if (!parsedUserData || !parsedUserData.phoneNo) {
          setError("User phone number not found in storage");
          setLoading(false);
          return;
        }
        
        setDebugInfo(prev => ({
          ...prev,
          connectionStatus: 'Connecting'
        }));
        
        // Make fetch request to SSE endpoint
        const response = await fetch(
          `${API_BASE_URL}/user-profile/${parsedUserData.phoneNo}`,
          {
            method: 'GET',
            headers: {
              Accept: 'text/event-stream',
              'Cache-Control': 'no-cache',
            },
          },
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        setDebugInfo(prev => ({
          ...prev,
          connectionStatus: 'Connected'
        }));
        
        const responseText = await response.text();
        const lines = responseText.split('\n');
        let jsonData = null;
        
        setDebugInfo(prev => ({
          ...prev,
          lastEvent: responseText.substring(0, 100) + '...'
        }));
        
        // Parse SSE response
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataString = line.substring(6);
            try {
              jsonData = JSON.parse(dataString);
              break;
            } catch (parseError) {
              console.error('Error parsing JSON from SSE:', parseError);
              setDebugInfo(prev => ({
                ...prev,
                lastError: `Parse error: ${parseError.message}`
              }));
            }
          }
        }
        
        if (jsonData && jsonData.success) {
          setUserData(jsonData.userData);
          processGameHistory(jsonData.userData);
          setLoading(false);
          setRefreshing(false);
          
          setDebugInfo(prev => ({
            ...prev,
            connectionStatus: 'Data received successfully'
          }));
          
          // Update AsyncStorage with latest user data
          const currentUserData = await AsyncStorage.getItem('userData');
          const parsedCurrentData = JSON.parse(currentUserData);
          await AsyncStorage.setItem(
            'userData',
            JSON.stringify({
              ...parsedCurrentData,
              tokens: jsonData.userData.tokens,
              ...jsonData.userData,
            }),
          );
        } else {
          throw new Error(jsonData?.message || "Failed to fetch user data");
        }
        
      } catch (fetchError) {
        console.error("Error fetching user profile:", fetchError);
        setError(`Error connecting to server: ${fetchError.message}`);
        setDebugInfo(prev => ({
          ...prev,
          connectionStatus: 'Error',
          lastError: fetchError.message
        }));
        setLoading(false);
        setRefreshing(false);
        
        // Attempt to reconnect after 5 seconds
        setTimeout(fetchUserProfile, 5000);
      }
    };
    
    // Initial fetch
    fetchUserProfile();
  }, []);

  const processGameHistory = (userData) => {
    if (!userData || !userData.game1 || !userData.game1["game-actions"]) {
      console.log("No game actions found in user data");
      setGameHistory([]);
      return;
    }
    
    const history = [];
    let totalPlayedAmount = 0;
    
    // Get game actions
    const gameActions = userData.game1["game-actions"];
    
    // Process each game action
    Object.keys(gameActions).forEach(actionId => {
      const action = gameActions[actionId];
      
      // Find which date this action belongs to
      let actionDate = "Unknown";
      const dailyBetAmounts = userData.game1["daily-bet-amount"];
      
      if (dailyBetAmounts) {
        Object.keys(dailyBetAmounts).forEach(date => {
          if (dailyBetAmounts[date].betIds && dailyBetAmounts[date].betIds.includes(actionId)) {
            actionDate = date;
          }
        });
      }
      
      // Create game entry with proper timestamp handling
      const gameEntry = {
        date: actionDate,
        gameMode: action.gameMode || 'N/A',
        gameType: "Game 1",
        playedNumbers: action.selectedNumbers ? action.selectedNumbers.join(', ') : 'N/A',
        session: action.sessionNumber || 'N/A',
        amount: action.betAmount || 0,
        status: action.status || 'N/A',
        timestamp: action.timestamp ? new Date(action.timestamp) : new Date(),
        timestampString: action.timestamp ? new Date(action.timestamp).toLocaleString() : 'Unknown time'
      };
      
      history.push(gameEntry);
      totalPlayedAmount += Number(action.betAmount || 0);
    });
    
    // Sort by timestamp (most recent first) - improved sorting
    history.sort((a, b) => {
      // Handle cases where timestamp might be invalid
      const timeA = a.timestamp instanceof Date && !isNaN(a.timestamp) ? a.timestamp.getTime() : 0;
      const timeB = b.timestamp instanceof Date && !isNaN(b.timestamp) ? b.timestamp.getTime() : 0;
      return timeB - timeA; // Most recent first
    });
    
    console.log(`Processed ${history.length} game entries with total amount: ${totalPlayedAmount}`);
    console.log('First few entries:', history.slice(0, 3).map(h => ({ date: h.date, timestamp: h.timestampString })));
    
    setGameHistory(history);
    setTotalAmount(totalPlayedAmount);
  };

  const retryFetch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const storedUserData = await AsyncStorage.getItem("userData");
      const parsedUserData = storedUserData ? JSON.parse(storedUserData) : null;
      
      if (parsedUserData && parsedUserData.phoneNo) {
        setDebugInfo(prev => ({
          ...prev,
          connectionStatus: 'Reconnecting',
          phoneNo: parsedUserData.phoneNo
        }));
        
        // Make fetch request to SSE endpoint
        const response = await fetch(
          `${API_BASE_URL}/user-profile/${parsedUserData.phoneNo}`,
          {
            method: 'GET',
            headers: {
              Accept: 'text/event-stream',
              'Cache-Control': 'no-cache',
            },
          },
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        setDebugInfo(prev => ({
          ...prev,
          connectionStatus: 'Reconnected'
        }));
        
        const responseText = await response.text();
        const lines = responseText.split('\n');
        let jsonData = null;
        
        setDebugInfo(prev => ({
          ...prev,
          lastEvent: responseText.substring(0, 100) + '...'
        }));
        
        // Parse SSE response
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataString = line.substring(6);
            try {
              jsonData = JSON.parse(dataString);
              break;
            } catch (parseError) {
              console.error('Error parsing JSON from SSE on retry:', parseError);
              setDebugInfo(prev => ({
                ...prev,
                lastError: `Parse error on retry: ${parseError.message}`
              }));
            }
          }
        }
        
        if (jsonData && jsonData.success) {
          setUserData(jsonData.userData);
          processGameHistory(jsonData.userData);
          setLoading(false);
          
          setDebugInfo(prev => ({
            ...prev,
            connectionStatus: 'Data received successfully on retry'
          }));
          
          // Update AsyncStorage with latest user data
          const currentUserData = await AsyncStorage.getItem('userData');
          const parsedCurrentData = JSON.parse(currentUserData);
          await AsyncStorage.setItem(
            'userData',
            JSON.stringify({
              ...parsedCurrentData,
              tokens: jsonData.userData.tokens,
              ...jsonData.userData,
            }),
          );
        } else {
          throw new Error(jsonData?.message || "Failed to fetch user data on retry");
        }
        
      } else {
        setError("Cannot retry: User phone number not found");
        setLoading(false);
      }
    } catch (fetchError) {
      console.error("Error on retry:", fetchError);
      setError(`Error reconnecting to server: ${fetchError.message}`);
      setDebugInfo(prev => ({
        ...prev,
        connectionStatus: 'Error on retry',
        lastError: fetchError.message
      }));
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await retryFetch();
  };

  const renderNumberBadge = (number, index) => (
    <View key={`${number}-${index}`} style={styles.numberBadge}>
      <Text style={styles.numberText}>{number}</Text>
    </View>
  );

  const renderGameItem = (game, index) => (
    <View key={index} style={styles.gameItem}>
      <View style={styles.gameItemHeader}>
        <View style={styles.dateContainer}>
          <Icon name="event" size={16} color="#666" />
          <Text style={styles.dateText}>{game.date}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amountText}>₹{formatCurrency(game.amount)}</Text>
        </View>
      </View>
      
      <View style={styles.gameItemBody}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Mode:</Text>
          <Text style={styles.infoValue}>{game.gameMode}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Session:</Text>
          <View style={styles.sessionBadge}>
            <Text style={styles.sessionText}>{game.session}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Time:</Text>
          <Text style={styles.infoValue}>{game.timestampString}</Text>
        </View>
        <View style={styles.numbersContainer}>
          <Text style={styles.infoLabel}>Pictures:</Text>
          <View style={styles.numbersRow}>
            {game.playedNumbers.split(', ').map((num, i) => renderNumberBadge(num, i))}
          </View>
        </View>
      </View>
    </View>
  );

  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#2196F3', '#1976D2']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingTitle}>Loading Game History</Text>
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>Phone: {debugInfo.phoneNo}</Text>
            <Text style={styles.debugText}>Status: {debugInfo.connectionStatus}</Text>
            {debugInfo.lastEvent && (
              <Text style={styles.debugText}>Last Event: {debugInfo.lastEvent}</Text>
            )}
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <LinearGradient
          colors={['#ff6b6b', '#ee5a24']}
          style={styles.errorGradient}
        >
          <Icon name="error" size={50} color="#fff" />
          <Text style={styles.errorTitle}>Error Loading Game History</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>Phone: {debugInfo.phoneNo}</Text>
            <Text style={styles.debugText}>Status: {debugInfo.connectionStatus}</Text>
            {debugInfo.lastError && (
              <Text style={styles.debugText}>Error: {debugInfo.lastError}</Text>
            )}
          </View>
          
          <TouchableOpacity style={styles.retryButton} onPress={retryFetch}>
            <Icon name="refresh" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  // Main content
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <LinearGradient
          colors={['#2196F3', '#1976D2']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Game History</Text>
          <View style={styles.totalAmountHeaderContainer}>
            <Text style={styles.totalAmountHeader}>₹{formatCurrency(totalAmount)}</Text>
          </View>
          <Text style={styles.totalAmountLabel}>Total Amount Played</Text>
        </LinearGradient>

        <View style={styles.userInfoContainer}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Icon name="person" size={24} color="#fff" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{userData?.name || 'User'}</Text>
              <Text style={styles.userPhone}>Phone: {userData?.phoneNo}</Text>
            </View>
          </View>
          <View style={styles.tokensContainer}>
            <Icon name="monetization-on" size={20} color="#4CAF50" />
            <Text style={styles.tokensText}>{formatTokens(userData?.tokens || 0)}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2196F3']}
            />
          }
        >
          {gameHistory.length > 0 ? (
            <>
              {gameHistory.map((game, index) => renderGameItem(game, index))}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="sentiment-neutral" size={60} color="#ccc" />
              <Text style={styles.emptyStateText}>No game history found</Text>
            </View>
          )}
        </ScrollView>
      </View>
      
      <BottomNavigation activeTab="History" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 20,
  },
  errorContainer: {
    flex: 1,
  },
  errorGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
  },
  debugContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    width: '100%',
  },
  debugText: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 2,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#fff',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  totalAmountHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalAmountHeader: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  totalAmountLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  userInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userPhone: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  tokensContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  tokensText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollViewContent: {
    paddingBottom: 100, // Add padding to account for bottom navigation height
  },
  gameItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  gameItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  amountContainer: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  gameItemBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
    minWidth: 60,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  sessionBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sessionText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  numbersContainer: {
    marginTop: 4,
  },
  numbersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  numberBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    marginBottom: 6,
  },
  numberText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});

export default UserGameHistory;