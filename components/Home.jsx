import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  Dimensions,
  StatusBar,
  RefreshControl,
  Modal,
  Animated,
  BackHandler,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import API_BASE_URL from './ApiConfig';
import styles from './HomeStyles';
import BottomNavigation from './BottomNavigation';
import EntryFees from './EntryFees';
import NetworkChecker from './NetworkChecker'; // Import the network checker

const { width, height } = Dimensions.get('window');

const Home = () => {
  // State variables
  const [tokenCount, setTokenCount] = useState(0);
  const [userData, setUserData] = useState(null);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [showWinnerPopup, setShowWinnerPopup] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [winnerDetails, setWinnerDetails] = useState([]);
  const [currentWinnerIndex, setCurrentWinnerIndex] = useState(0);
  const [processedWinnerIds, setProcessedWinnerIds] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);
  
  // Entry fee related states
  const [showEntryFeePopup, setShowEntryFeePopup] = useState(false);
  const [isEntryFeePaid, setIsEntryFeePaid] = useState(false);
  const [userProfileLoaded, setUserProfileLoaded] = useState(false);
  const [entryFeeChecked, setEntryFeeChecked] = useState(false);
  
  // Network connectivity state
  const [isConnected, setIsConnected] = useState(true);

  // Animation values
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [dropdownAnim] = useState(new Animated.Value(0));

  const navigation = useNavigation();

  // Format token count for display (show full numbers)
  const formatTokenCount = (count) => {
    return count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Network connectivity monitor
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected && state.isInternetReachable;
      setIsConnected(connected);
    });

    return () => unsubscribe();
  }, []);

  // Initialize user data and check entry fee status from AsyncStorage
  useEffect(() => {
    const initializeUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const parsedUserData = JSON.parse(userDataString);
          setUserData(parsedUserData);
          
          // Check stored entry fee status
          if (parsedUserData.entryFee === "paid") {
            setIsEntryFeePaid(true);
            setEntryFeeChecked(true);
          } else {
            setIsEntryFeePaid(false);
          }
          
          // Set stored token count
          if (parsedUserData.tokens) {
            setTokenCount(parsedUserData.tokens);
          }
        }
        setUserProfileLoaded(true);
      } catch (error) {
        console.error('Error initializing user data:', error);
        setUserProfileLoaded(true);
      }
    };
    initializeUserData();
  }, []);

  // Handle back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (showWinnerPopup || showLogoutPopup || showDropdown) {
          if (showDropdown) {
            setShowDropdown(false);
          }
          return true;
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => backHandler.remove();
    }, [showWinnerPopup, showLogoutPopup, showDropdown]),
  );

  // Handle entry fee payment completion
  const handleEntryFeePaymentSuccess = async () => {
    setIsEntryFeePaid(true);
    setShowEntryFeePopup(false);
    setEntryFeeChecked(true);
    
    // Update AsyncStorage immediately
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const parsedUserData = JSON.parse(userDataString);
        parsedUserData.entryFee = "paid";
        await AsyncStorage.setItem('userData', JSON.stringify(parsedUserData));
      }
    } catch (error) {
      console.error('Error updating entry fee status:', error);
    }
    
    // Refresh user data after payment
    if (userData && isConnected) {
      fetchUserTokens();
    }
  };

  // Function to check for winners
  const checkForWinners = async () => {
    try {
      if (!userData || !userData.phoneNo || !isEntryFeePaid || !isConnected) return;

      const response = await fetch(
        `${API_BASE_URL}/get-user-winners/${userData.phoneNo}`,
        {
          timeout: 10000, // 10 second timeout
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const unshownWinners = await response.json();

      if (unshownWinners.length > 0) {
        const newWinners = unshownWinners.filter(
          winner => !processedWinnerIds.has(winner.id),
        );

        if (newWinners.length > 0) {
          setProcessedWinnerIds(prev => {
            const newSet = new Set(prev);
            newWinners.forEach(winner => newSet.add(winner.id));
            return newSet;
          });

          const sortedWinners = newWinners.sort((a, b) => {
            return (a.timestamp || 0) - (b.timestamp || 0);
          });

          setWinnerDetails(sortedWinners);
          setCurrentWinnerIndex(0);
          setShowWinnerPopup(true);

          Animated.parallel([
            Animated.spring(scaleAnim, {
              toValue: 1,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();
        }
      }
    } catch (error) {
      console.error('Error checking winners:', error);
      // Don't show alerts for network errors to avoid spam
    }
  };

  // Function to fetch user tokens and profile data
  const fetchUserTokens = async () => {
    try {
      if (!userData || !userData.phoneNo || !isConnected) {
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          if (parsedData.tokens) {
            setTokenCount(parsedData.tokens);
          }
          // Check stored entry fee status when offline
          if (parsedData.entryFee === "paid") {
            setIsEntryFeePaid(true);
            setEntryFeeChecked(true);
          }
        }
        return;
      }

      console.log("Fetching tokens for:", userData.phoneNo);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(
        `${API_BASE_URL}/user-profile/${userData.phoneNo}`,
        {
          method: 'GET',
          headers: {
            Accept: 'text/event-stream',
            'Cache-Control': 'no-cache',
          },
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log("Raw response:", responseText);

      const lines = responseText.split('\n');
      let jsonData = null;

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataString = line.substring(6);
          try {
            jsonData = JSON.parse(dataString);
            break;
          } catch (parseError) {
            console.error('Error parsing JSON from SSE:', parseError);
          }
        }
      }

      if (jsonData && jsonData.success) {
        console.log("Received token update:", jsonData.tokens);
        setTokenCount(jsonData.tokens);

        // Check entry fee status from server
        const entryFeeStatus = jsonData.userData?.entryFee;
        console.log("Entry fee status from server:", entryFeeStatus);
        
        if (entryFeeStatus === "paid") {
          setIsEntryFeePaid(true);
          setEntryFeeChecked(true);
        } else {
          setIsEntryFeePaid(false);
          // Only show entry fee popup if we haven't checked before or if it's explicitly not paid
          if (!entryFeeChecked) {
            setShowEntryFeePopup(true);
            setEntryFeeChecked(true);
          }
        }

        // Update AsyncStorage with fresh data
        const currentUserData = await AsyncStorage.getItem('userData');
        const parsedCurrentData = JSON.parse(currentUserData);
        await AsyncStorage.setItem(
          'userData',
          JSON.stringify({
            ...parsedCurrentData,
            tokens: jsonData.tokens,
            ...jsonData.userData,
          }),
        );
      } else {
        console.error("Error in token fetch:", jsonData?.message || "No valid data received");
        // Fallback to stored data
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          if (parsedData.tokens) {
            setTokenCount(parsedData.tokens);
          }
          // Use stored entry fee status if server fails
          if (parsedData.entryFee === "paid") {
            setIsEntryFeePaid(true);
            setEntryFeeChecked(true);
          } else if (!entryFeeChecked) {
            setShowEntryFeePopup(true);
            setEntryFeeChecked(true);
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error("Request timed out");
      } else {
        console.error("Error fetching tokens:", error.message || error);
      }
      
      // Fallback to stored data on error
      const storedUserData = await AsyncStorage.getItem('userData');
      if (storedUserData) {
        const parsedData = JSON.parse(storedUserData);
        if (parsedData.tokens) {
          setTokenCount(parsedData.tokens);
        }
        // Use stored entry fee status if server fails
        if (parsedData.entryFee === "paid") {
          setIsEntryFeePaid(true);
          setEntryFeeChecked(true);
        } else if (!entryFeeChecked) {
          // Only show entry fee popup if we haven't checked before
          setShowEntryFeePopup(true);
          setEntryFeeChecked(true);
        }
      }
    } finally {
      setUserProfileLoaded(true);
    }
  };

  // Polling effect - Only run when connected and entry fee is paid
  useEffect(() => {
    let pollingInterval = null;

    if (isConnected) {
      // Initial fetch when connected
      fetchUserTokens();

      // Set up polling for real-time updates (every 30 seconds) only if connected and entry fee is paid
      if (isEntryFeePaid) {
        pollingInterval = setInterval(() => {
          if (isConnected) {
            fetchUserTokens();
            checkForWinners();
          }
        }, 30000);
      }
    }

    // Cleanup on component unmount
    return () => {
      if (pollingInterval) {
        console.log("Clearing token polling interval");
        clearInterval(pollingInterval);
      }
    };
  }, [userData, isEntryFeePaid, isConnected]); // Add isConnected as dependency

  // Handle logout
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userData');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  // Toggle dropdown - Don't allow if entry fee is not paid
  const toggleDropdown = () => {
    if (!isEntryFeePaid) {
      return;
    }
    
    if (showDropdown) {
      Animated.timing(dropdownAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowDropdown(false));
    } else {
      setShowDropdown(true);
      Animated.timing(dropdownAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  // Close winner popup
  const closeWinnerPopup = async () => {
    try {
      const currentWinner = winnerDetails[currentWinnerIndex];
      if (currentWinner && currentWinner.id && isConnected) {
        console.log(`Marking winner ${currentWinner.id} as claimed`);
        await fetch(`${API_BASE_URL}/mark-winner-claimed/${currentWinner.id}`, {
          method: 'POST',
          timeout: 10000,
        });
      }

      if (currentWinnerIndex < winnerDetails.length - 1) {
        setCurrentWinnerIndex(prevIndex => prevIndex + 1);
      } else {
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 0,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowWinnerPopup(false);
          setCurrentWinnerIndex(0);
          setWinnerDetails([]);
          scaleAnim.setValue(0);
          fadeAnim.setValue(0);
          
          // Optional: Clear processed winners set after some time to allow new checks
          setTimeout(() => {
            setProcessedWinnerIds(new Set());
          }, 60000); // Clear after 1 minute
        });
      }
    } catch (error) {
      console.error('Error marking winner as claimed:', error);
    }
  };

  // Handle game navigation - Don't allow if entry fee is not paid
  const handleClickGame1 = () => {
    if (!isEntryFeePaid) {
      return;
    }
    navigation.navigate('Game1');
  };

  // Handle navigation - Prevent if entry fee is not paid
  const handleNavigation = (routeName) => {
    if (!isEntryFeePaid) {
      return;
    }
    navigation.navigate(routeName);
  };

  // Handle refresh
  const onRefresh = useCallback(async () => {
    if (!isConnected) {
      return;
    }
    
    setRefreshing(true);
    await fetchUserTokens();
    if (isEntryFeePaid) {
      await checkForWinners();
    }
    setRefreshing(false);
  }, [userData, isEntryFeePaid, isConnected]);

  // Dropdown menu items
  const dropdownItems = [
    { name: 'Friend Earnings', icon: 'gift', route: 'Earnings' },
    { name: 'Help', icon: 'help-circle', route: 'Help' },
    {
      name: 'Logout',
      icon: 'logout',
      action: () => setShowLogoutPopup(true),
      isLogout: true,
    },
  ];

  // Determine if we should show entry fee popup
  const shouldShowEntryFeePopup = showEntryFeePopup && 
                                   userProfileLoaded && 
                                   !isEntryFeePaid && 
                                   entryFeeChecked;

  return (
    <NetworkChecker>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="rgb(42, 82, 152)" />

        {/* Entry Fee Popup - Only show if user hasn't paid and we've checked */}
        {shouldShowEntryFeePopup && (
          <EntryFees 
            navigation={navigation}
            onContinue={handleEntryFeePaymentSuccess} 
          />
        )}

        {/* Winner Popup - Only show if entry fee is paid */}
        {isEntryFeePaid && (
          <Modal
            visible={showWinnerPopup}
            transparent={true}
            animationType="none"
            onRequestClose={() => {}}
          >
            <Animated.View
              style={[styles.winnerPopupOverlay, { opacity: fadeAnim }]}
            >
              <Animated.View
                style={[styles.winnerPopup, { transform: [{ scale: scaleAnim }] }]}
              >
                <LinearGradient
                  colors={['#ffd700', '#ffed4e', '#ffd700']}
                  style={styles.winnerGradient}
                >
                  <View style={styles.winnerPopupHeader}>
                    <Icon name="trophy" size={60} color="#ff6f00" />
                    <Text style={styles.winnerPopupTitle}>Congratulations!</Text>
                  </View>

                  {winnerDetails.length > 0 && (
                    <Text style={styles.winnerPopupMessage}>
                      You won{' '}
                      <Text style={styles.winnerAmount}>
                        {winnerDetails[currentWinnerIndex]?.amountWon}
                      </Text>{' '}
                      tokens in the Open-Close game (
                      {winnerDetails[currentWinnerIndex]?.winType})!
                    </Text>
                  )}

                  <TouchableOpacity
                    style={styles.winnerPopupButton}
                    onPress={closeWinnerPopup}
                  >
                    <LinearGradient
                      colors={['rgb(42, 82, 152)', 'rgb(55, 98, 175)']}
                      style={styles.buttonGradient}
                    >
                      <Text style={styles.winnerPopupButtonText}>
                        {currentWinnerIndex < winnerDetails.length - 1
                          ? 'Next Win'
                          : 'Claim Reward'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </Animated.View>
            </Animated.View>
          </Modal>
        )}

        {/* Logout Confirmation Modal - Only show if entry fee is paid */}
        {isEntryFeePaid && (
          <Modal
            visible={showLogoutPopup}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowLogoutPopup(false)}
          >
            <View style={styles.logoutPopupOverlay}>
              <View style={styles.logoutPopup}>
                <Icon name="logout" size={50} color="#f44336" />
                <Text style={styles.logoutPopupTitle}>Confirm Logout</Text>
                <Text style={styles.logoutPopupMessage}>
                  Are you sure you want to log out? You will need to log in again to
                  access your account.
                </Text>
                <View style={styles.logoutPopupButtons}>
                  <TouchableOpacity
                    style={[styles.logoutButton, styles.confirmButton]}
                    onPress={handleLogout}
                  >
                    <Text style={styles.logoutButtonText}>Yes, Logout</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.logoutButton, styles.cancelButton]}
                    onPress={() => setShowLogoutPopup(false)}
                  >
                    <Text
                      style={[styles.logoutButtonText, styles.cancelButtonText]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Dropdown Overlay */}
        {showDropdown && (
          <TouchableOpacity
            style={styles.dropdownOverlay}
            activeOpacity={1}
            onPress={() => setShowDropdown(false)}
          />
        )}

        {/* Header Container */}
        <View>
          {/* Professional Header */}
          <LinearGradient 
            colors={['rgb(42, 82, 152)', 'rgb(55, 98, 175)']} 
            style={styles.header}
          >
            <View style={styles.headerContent}>
              {/* Logo and Brand */}
              <View style={styles.brandContainer}>
                <View style={styles.logoContainer}>
                  <Image
                    source={require('../images/logo-1.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.brandText}>NAPHEX</Text>
              </View>

              {/* Menu Button - Disabled if entry fee not paid */}
              <TouchableOpacity 
                style={[
                  styles.menuButton,
                  !isEntryFeePaid && styles.disabledButton
                ]} 
                onPress={toggleDropdown}
                disabled={!isEntryFeePaid}
              >
                <Icon 
                  name="menu" 
                  size={28} 
                  color={!isEntryFeePaid ? "#ffffff80" : "#ffffff"} 
                />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Dropdown Menu - Only show if entry fee is paid */}
          {isEntryFeePaid && showDropdown && (
            <Animated.View
              style={[
                styles.dropdownMenu,
                {
                  opacity: dropdownAnim,
                  transform: [
                    {
                      translateY: dropdownAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {dropdownItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setShowDropdown(false);
                    if (item.action) {
                      item.action();
                    } else {
                      handleNavigation(item.route);
                    }
                  }}
                >
                  <Icon
                    name={item.icon}
                    size={20}
                    color={item.isLogout ? '#f44336' : 'rgb(42, 82, 152)'}
                  />
                  <Text
                    style={[
                      styles.dropdownItemText,
                      item.isLogout && styles.logoutText,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}
        </View>

        {/* Token Section - Disabled if entry fee not paid */}
        <View style={styles.tokenSection}>
          <TouchableOpacity
            style={[
              styles.tokenCard,
              !isEntryFeePaid && styles.disabledTokenCard
            ]}
            onPress={() => isEntryFeePaid && handleNavigation('AddTokens')}
            disabled={!isEntryFeePaid}
          >
            <LinearGradient
              colors={['rgb(42, 82, 152)', 'rgb(55, 98, 175)']}
              style={[
                styles.tokenCardGradient,
                !isEntryFeePaid && styles.disabledGradient
              ]}
            >
              <View style={styles.tokenCardContent}>
                <View style={styles.tokenDisplaySection}>
                  <View style={styles.tokenIconContainer}>
                    <Icon 
                      name="wallet" 
                      size={28} 
                      color={!isEntryFeePaid ? "#ffffff80" : "#ffffff"} 
                    />
                  </View>
                  <View style={styles.tokenValueContainer}>
                    <Text style={[
                      styles.tokenValue,
                      !isEntryFeePaid && styles.disabledText
                    ]}>
                      {formatTokenCount(tokenCount)}
                    </Text>
                    <Text style={[
                      styles.tokenUnit,
                      !isEntryFeePaid && styles.disabledText
                    ]}>
                      {!isEntryFeePaid ? "Pay Entry Fee to Access" : "Your Tokens"}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={[
                    styles.addTokenButton,
                    !isEntryFeePaid && styles.disabledAddButton
                  ]}
                  onPress={() => isEntryFeePaid && handleNavigation('AddTokens')}
                  disabled={!isEntryFeePaid}
                >
                  <Icon 
                    name="plus" 
                    size={20} 
                    color={!isEntryFeePaid ? "#ffffff80" : "#ffffff"} 
                  />
                  <Text style={[
                    styles.addTokenText,
                    !isEntryFeePaid && styles.disabledText
                  ]}>
                    {!isEntryFeePaid ? "Locked" : "Add"}
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              enabled={isConnected} // Disable refresh when offline
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Game Banner - Disabled if entry fee not paid */}
          <View style={styles.bannerContainer}>
            <TouchableOpacity 
              style={[
                styles.gameBanner,
                !isEntryFeePaid && styles.disabledBanner
              ]} 
              activeOpacity={isEntryFeePaid ? 0.9 : 1}
              onPress={handleClickGame1}
              disabled={!isEntryFeePaid}
            >
              <Image
                source={require('../images/Banner-2.png')}
                style={[
                  styles.bannerImage,
                  !isEntryFeePaid && styles.disabledImage
                ]}
                resizeMode="cover"
              />
              <View style={styles.bannerOverlay}>
                <TouchableOpacity
                  style={[
                    styles.startGameButton,
                    !isEntryFeePaid && styles.disabledStartButton
                  ]}
                  onPress={handleClickGame1}
                  disabled={!isEntryFeePaid}
                >
                  <LinearGradient
                    colors={['rgb(42, 82, 152)', 'rgb(55, 98, 175)']}
                    style={styles.startGameGradient}
                  >
                    <Icon 
                      name={!isEntryFeePaid ? "lock" : "play"} 
                      size={20} 
                      color={!isEntryFeePaid ? "#ffffff80" : "#ffffff"} 
                    />
                    <Text style={[
                      styles.startGameText,
                      !isEntryFeePaid && styles.disabledText
                    ]}>
                      {!isEntryFeePaid ? "Pay Entry Fee" : "Play Now"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>

          {/* Coming Soon Games Container */}
          <View style={styles.comingSoonContainer}>
            <LinearGradient
              colors={['rgb(42, 82, 152)', 'rgb(55, 98, 175)']}
              style={styles.comingSoonGradient}
            >
              <View style={styles.comingSoonHeader}>
                <Icon name="gamepad-variant" size={40} color="#ffffff" />
                <Text style={styles.comingSoonTitle}>More Exciting Games</Text>
                <Text style={styles.comingSoonSubtitle}>Coming Soon!</Text>
              </View>
               <View style={styles.notifyButton}>
                <Text style={styles.notifyText}>Get notified when available</Text>
                <Icon name="bell" size={16} color="#ffffff" />
              </View>
            </LinearGradient>
          </View>
        </ScrollView>

        {/* Bottom Navigation Component - Only show if entry fee is paid */}
        {isEntryFeePaid && <BottomNavigation activeTab="Home" />}
      </View>
    </NetworkChecker>
  );
};

export default Home;