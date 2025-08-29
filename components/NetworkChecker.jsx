import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  BackHandler,
  Dimensions,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const NetworkChecker = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [showNoInternetModal, setShowNoInternetModal] = useState(false);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log('Network state:', state);
      
      const connected = state.isConnected && state.isInternetReachable;
      setIsConnected(connected);
      
      if (!connected && !showNoInternetModal) {
        setShowNoInternetModal(true);
      } else if (connected && showNoInternetModal) {
        setShowNoInternetModal(false);
      }
    });

    // Initial network check
    NetInfo.fetch().then(state => {
      const connected = state.isConnected && state.isInternetReachable;
      setIsConnected(connected);
      if (!connected) {
        setShowNoInternetModal(true);
      }
    });

    return () => unsubscribe();
  }, [showNoInternetModal]);

  // Handle back button when modal is shown
  useEffect(() => {
    const backAction = () => {
      if (showNoInternetModal) {
        handleCloseApp();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [showNoInternetModal]);

  const handleCloseApp = () => {
    Alert.alert(
      'Exit App',
      'No internet connection. The app will close now.',
      [
        {
          text: 'OK',
          onPress: () => {
            BackHandler.exitApp();
          },
        },
      ],
      { cancelable: false },
    );
  };

  const handleRetry = async () => {
    try {
      const state = await NetInfo.fetch();
      const connected = state.isConnected && state.isInternetReachable;
      
      if (connected) {
        setIsConnected(true);
        setShowNoInternetModal(false);
      } else {
        Alert.alert(
          'Still No Connection',
          'Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error checking network:', error);
      Alert.alert(
        'Error',
        'Unable to check network status. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <>
      {children}
      
      <Modal
        visible={showNoInternetModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseApp}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['#ff4444', '#cc0000']}
              style={styles.modalGradient}
            >
              <View style={styles.iconContainer}>
                <Icon name="wifi-off" size={80} color="#ffffff" />
              </View>
              
              <Text style={styles.title}>No Internet Connection</Text>
              
              <Text style={styles.message}>
                Please check your internet connection and restart the app to continue.
              </Text>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={handleRetry}
                >
                  <LinearGradient
                    colors={['#4CAF50', '#45a049']}
                    style={styles.buttonGradient}
                  >
                    <Icon name="refresh" size={20} color="#ffffff" />
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.exitButton}
                  onPress={handleCloseApp}
                >
                  <LinearGradient
                    colors={['#757575', '#424242']}
                    style={styles.buttonGradient}
                  >
                    <Icon name="exit-to-app" size={20} color="#ffffff" />
                    <Text style={styles.exitButtonText}>Exit App</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalGradient: {
    padding: 30,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
    opacity: 0.9,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 15,
  },
  retryButton: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  exitButton: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    gap: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  exitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NetworkChecker;