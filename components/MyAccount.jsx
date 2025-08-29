import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Clipboard,
  ToastAndroid,
  Platform,
  Dimensions,
  RefreshControl,
  StatusBar,
  SafeAreaView,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventSourcePolyfill } from 'event-source-polyfill';
import Icon from 'react-native-vector-icons/MaterialIcons';
import API_BASE_URL from './ApiConfig';

const { width, height } = Dimensions.get('window');

const MyAccount = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [phoneNo, setPhoneNo] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedImageTitle, setSelectedImageTitle] = useState('');

  useEffect(() => {
    initializeUserData();
  }, []);

  const initializeUserData = async () => {
    const userPhoneNo = await getUserDataFromAsyncStorage();
    if (userPhoneNo) {
      fetchUserData(userPhoneNo);
    } else {
      setError('User phone number not found. Please log in again.');
      setLoading(false);
    }
  };

  const getUserDataFromAsyncStorage = async () => {
    try {
      const localUserData = await AsyncStorage.getItem('userData');
      if (localUserData) {
        const parsedData = JSON.parse(localUserData);
        if (parsedData && parsedData.phoneNo) {
          setPhoneNo(parsedData.phoneNo);
          return parsedData.phoneNo;
        }
      }
      return null;
    } catch (err) {
      console.error('Error getting user data from AsyncStorage:', err);
      return null;
    }
  };

  const fetchUserData = async (userPhoneNo) => {
    try {
      setLoading(true);
      
      const eventSource = new EventSourcePolyfill(`${API_BASE_URL}/user-profile/${userPhoneNo}`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received user data:', data);
        
        if (data.success) {
          setUserData(data.userData);
          setLoading(false);
          setRefreshing(false);
          eventSource.close();
        } else {
          setError(data.message);
          setLoading(false);
          setRefreshing(false);
          eventSource.close();
        }
      };
      
      eventSource.onerror = (err) => {
        console.error('EventSource error:', err);
        setError('Failed to connect to server');
        setLoading(false);
        setRefreshing(false);
        eventSource.close();
      };
      
      return () => {
        eventSource.close();
      };
    } catch (err) {
      console.error('Fetch error:', err);
      setError('An error occurred while fetching user data');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const userPhoneNo = await getUserDataFromAsyncStorage();
    if (userPhoneNo) {
      fetchUserData(userPhoneNo);
    } else {
      setRefreshing(false);
    }
  };

  const copyToClipboard = async (text, label) => {
    try {
      await Clipboard.setString(text);
      if (Platform.OS === 'android') {
        ToastAndroid.show(`${label} copied to clipboard!`, ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', `${label} copied to clipboard!`);
      }
    } catch (err) {
      if (Platform.OS === 'android') {
        ToastAndroid.show(`Failed to copy ${label}`, ToastAndroid.SHORT);
      } else {
        Alert.alert('Error', `Failed to copy ${label}`);
      }
    }
  };

  // Share function for social media
  const shareId = async (id, label) => {
    const shareText = `My ${label}: ${id}`;

    try {
      const result = await Share.share({
        title: `My ${label}`,
        message: shareText,
      });

      if (result.action === Share.sharedAction) {
        if (Platform.OS === 'android') {
          ToastAndroid.show(`${label} shared successfully!`, ToastAndroid.SHORT);
        } else {
          // On iOS, we can't detect if it was actually shared or dismissed
          if (result.activityType) {
            Alert.alert('Success', `${label} shared successfully!`);
          }
        }
      } else if (result.action === Share.dismissedAction) {
        // User dismissed the share dialog
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Share error:', error);
      // Fallback to copying to clipboard
      await copyToClipboard(shareText, `${label} share text`);
      if (Platform.OS === 'android') {
        ToastAndroid.show(`${label} share text copied to clipboard!`, ToastAndroid.LONG);
      } else {
        Alert.alert('Info', `${label} share text copied to clipboard! You can now paste it on any social media platform.`);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleContactSupport = () => {
    navigation.navigate('Help');
  };

  const handleImageClick = (imageUrl, title) => {
    console.log('Image clicked:', imageUrl, title);
    if (imageUrl) {
      setSelectedImage(imageUrl);
      setSelectedImageTitle(title);
      setShowImageModal(true);
    } else {
      Alert.alert('Error', 'Image not available');
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleBackPress = () => {
    navigation.navigate('Home');
  };

  const handleTransactionHistory = () => {
    navigation.navigate('TransactionHistory');
  };

  const handleBankDetails = () => {
  navigation.navigate('BankDetails');
};

const handleAddToken = ()=>{
  navigation.navigate("AddTokens")
}
const handleWithdraw = ()=>{
  navigation.navigate("Withdraw")
}
  const getUserId = () => {
    if (userData?.userIds?.myuserid) {
      return userData.userIds.myuserid;
    }
    if (userData?.userids?.myuserid) {
      return userData.userids.myuserid;
    }
    if (userData?.myuserid) {
      return userData.myuserid;
    }
    return "Loading...";
  };

  const getReferralId = () => {
    if (userData?.userIds?.myrefrelid) {
      return userData.userIds.myrefrelid;
    }
    if (userData?.userids?.myrefrelid) {
      return userData.userids.myrefrelid;
    }
    if (userData?.myrefrelid) {
      return userData.myrefrelid;
    }
    return "Loading...";
  };

  const getKycStatusBadge = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'accepted':
        return { text: 'Verified', color: '#28a745', icon: 'verified' };
      case 'submitted':
        return { text: 'Under Review', color: '#ffc107', icon: 'pending' };
      case 'rejected':
        return { text: 'Rejected', color: '#dc3545', icon: 'error' };
      default:
        return { text: 'Not Submitted', color: '#6c757d', icon: 'info' };
    }
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading user profile...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={64} color="#dc3545" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={initializeUserData}>
            <Icon name="refresh" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!userData) {
      return (
        <View style={styles.errorContainer}>
          <Icon name="warning" size={64} color="#ffc107" />
          <Text style={styles.warningText}>No user data found.</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'profile':
        return renderProfile();
      case 'referral':
        return renderReferral();
      case 'account':
        return renderAccount();
      case 'kyc':
        return renderKYC();
      case 'support':
        return renderSupport();
      default:
        return renderProfile();
    }
  };

  const renderProfile = () => (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.profileCard}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.onlineIndicator} />
          </View>
          <Text style={styles.profileName}>{userData.name || 'Kartik'}</Text>
          <Text style={styles.profilePhone}>{userData.phoneNo || '7023862377'}</Text>
        </View>

        <View style={styles.profileDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Icon name="location-on" size={22} color="#007bff" style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Location</Text>
            </View>
            <Text style={styles.detailValue}>
              {userData.city || 'Oja'}, {userData.state || 'Karnataka'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Icon name="calendar-today" size={22} color="#007bff" style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Member Since</Text>
            </View>
            <Text style={styles.detailValue}>
              {userData.createdAt ? formatDate(userData.createdAt) : 'Jul 25, 2025'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Icon name="account-balance-wallet" size={22} color="#007bff" style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Available Balance</Text>
            </View>
            <View style={styles.tokensBadge}>
              <Icon name="monetization-on" size={16} color="white" />
              <Text style={styles.tokensBadgeText}>
                {(userData.tokens || 50000).toLocaleString()}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Icon name="fingerprint" size={22} color="#007bff" style={styles.detailIcon} />
              <Text style={styles.detailLabel}>User ID</Text>
            </View>
            <Text style={styles.detailValue}>{getUserId()}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Icon name="share" size={22} color="#007bff" style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Referral ID</Text>
            </View>
            <Text style={styles.detailValue}>{getReferralId()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionCard}>
        <TouchableOpacity style={styles.actionButton} onPress={handleForgotPassword}>
          <View style={styles.actionButtonContent}>
            <View style={styles.actionIconContainer}>
              <Icon name="lock-reset" size={24} color="#007bff" />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Reset Password</Text>
              <Text style={styles.actionSubtitle}>Change your account password securely</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#ccc" />
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderReferral = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.referralCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIconContainer}>
            <Icon name="share" size={24} color="#007bff" />
          </View>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>Your Referral ID</Text>
            <Text style={styles.cardSubtitle}>Share with friends to earn rewards</Text>
          </View>
        </View>
        <View style={styles.referralCodeContainer}>
          <Text style={styles.referralCode}>{getReferralId()}</Text>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => copyToClipboard(getReferralId(), "Referral ID")}
            disabled={getReferralId() === "Loading..."}
          >
            <Icon name="content-copy" size={18} color="white" style={styles.buttonIcon} />
            <Text style={styles.copyButtonText}>Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => shareId(getReferralId(), "Referral ID")}
            disabled={getReferralId() === "Loading..."}
          >
            <Icon name="share" size={18} color="white" style={styles.buttonIcon} />
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.referralCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIconContainer}>
            <Icon name="fingerprint" size={24} color="#007bff" />
          </View>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>Your User ID</Text>
            <Text style={styles.cardSubtitle}>Unique identifier for your account</Text>
          </View>
        </View>
        <View style={styles.referralCodeContainer}>
          <Text style={styles.referralCode}>{getUserId()}</Text>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => copyToClipboard(getUserId(), "User ID")}
            disabled={getUserId() === "Loading..."}
          >
            <Icon name="content-copy" size={18} color="white" style={styles.buttonIcon} />
            <Text style={styles.copyButtonText}>Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => shareId(getUserId(), "User ID")}
            disabled={getUserId() === "Loading..."}
          >
            <Icon name="share" size={18} color="white" style={styles.buttonIcon} />
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderAccount = () => (
  <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <View style={styles.overviewCard}>
      <View style={styles.tokenSummary}>
        <View style={styles.tokenIconContainer}>
          <Icon name="account-balance-wallet" size={48} color="#007bff" />
        </View>
        <Text style={styles.tokenAmount}>{(userData.tokens || 50000).toLocaleString()}</Text>
        <Text style={styles.tokenLabel}>Available Tokens</Text>
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleAddToken}>
          <Icon name="add-circle" size={20} color="white" style={styles.buttonIcon} />
          <Text style={styles.primaryButtonText}>Add Tokens</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleWithdraw}>
          <Icon name="account-balance" size={20} color="#007bff" style={styles.buttonIcon} />
          <Text style={styles.secondaryButtonText}>Withdraw</Text>
        </TouchableOpacity>
      </View>
      
      {/* Bank Details Button */}
      <TouchableOpacity style={styles.bankDetailsButton} onPress={handleBankDetails}>
        <Icon name="account-balance" size={20} color="#28a745" style={styles.buttonIcon} />
        <Text style={styles.bankDetailsButtonText}>Bank Details</Text>
      </TouchableOpacity>
      
      {/* Transaction History Button */}
      <TouchableOpacity style={styles.transactionButton} onPress={handleTransactionHistory}>
        <Icon name="history" size={20} color="#007bff" style={styles.buttonIcon} />
        <Text style={styles.transactionButtonText}>Transaction History</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.summaryCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIconContainer}>
          <Icon name="account-circle" size={24} color="#007bff" />
        </View>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle}>Account Summary</Text>
          <Text style={styles.cardSubtitle}>Your account information</Text>
        </View>
      </View>
      
      <View style={styles.summaryContent}>
        <View style={styles.summaryItem}>
          <View style={styles.detailLeft}>
            <Icon name="person" size={20} color="#666" style={styles.detailIcon} />
            <Text style={styles.summaryLabel}>Full Name</Text>
          </View>
          <Text style={styles.summaryValue}>{userData.name}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <View style={styles.detailLeft}>
            <Icon name="phone" size={20} color="#666" style={styles.detailIcon} />
            <Text style={styles.summaryLabel}>Phone Number</Text>
          </View>
          <Text style={styles.summaryValue}>{userData.phoneNo}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <View style={styles.detailLeft}>
            <Icon name="location-city" size={20} color="#666" style={styles.detailIcon} />
            <Text style={styles.summaryLabel}>Location</Text>
          </View>
          <Text style={styles.summaryValue}>{userData.city}, {userData.state}</Text>
        </View>
      </View>
    </View>
  </ScrollView>
);

  const renderKYC = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.kycCard}>
        <View style={styles.kycHeader}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Icon name="verified-user" size={24} color="#007bff" />
            </View>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardTitle}>KYC Verification</Text>
              <Text style={styles.cardSubtitle}>Verify your identity for security</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getKycStatusBadge(userData.kycStatus).color }]}>
            <Icon 
              name={getKycStatusBadge(userData.kycStatus).icon} 
              size={16} 
              color="white" 
              style={styles.statusIcon} 
            />
            <Text style={styles.statusText}>{getKycStatusBadge(userData.kycStatus).text}</Text>
          </View>
        </View>

        {userData.kyc ? (
          <View style={styles.kycContent}>
            <View style={styles.kycInfo}>
              <View style={styles.detailLeft}>
                <Icon name="event" size={20} color="#666" style={styles.detailIcon} />
                <Text style={styles.kycInfoLabel}>Submitted Date</Text>
              </View>
              <Text style={styles.kycInfoValue}>
                {userData.kycSubmittedAt ? formatDate(userData.kycSubmittedAt) : 'N/A'}
              </Text>
            </View>

            <View style={styles.documentsSection}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconContainer}>
                  <Icon name="folder-open" size={20} color="#007bff" />
                </View>
                <View style={styles.cardTitleContainer}>
                  <Text style={styles.documentsTitle}>Uploaded Documents</Text>
                  <Text style={styles.cardSubtitle}>Tap to view full size</Text>
                </View>
              </View>
              
              <View style={styles.documentsContainer}>
                {userData.kyc.aadharCardUrl && (
                  <TouchableOpacity 
                    style={styles.documentItem}
                    onPress={() => handleImageClick(userData.kyc.aadharCardUrl, 'Aadhar Card')}
                    activeOpacity={0.8}
                  >
                    <Image 
                      source={{ uri: userData.kyc.aadharCardUrl }} 
                      style={styles.documentImage}
                      onError={(error) => console.log('Image load error:', error)}
                    />
                    <View style={styles.documentOverlay}>
                      <Icon name="zoom-in" size={24} color="white" />
                    </View>
                    <View style={styles.documentLabelContainer}>
                      <Icon name="credit-card" size={18} color="#007bff" />
                      <Text style={styles.documentLabel}>Aadhar Card</Text>
                      <View style={styles.verifiedBadge}>
                        <Icon name="verified" size={14} color="#28a745" />
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
                
                {userData.kyc.panCardUrl && (
                  <TouchableOpacity 
                    style={styles.documentItem}
                    onPress={() => handleImageClick(userData.kyc.panCardUrl, 'PAN Card')}
                    activeOpacity={0.8}
                  >
                    <Image 
                      source={{ uri: userData.kyc.panCardUrl }} 
                      style={styles.documentImage}
                      onError={(error) => console.log('Image load error:', error)}
                    />
                    <View style={styles.documentOverlay}>
                      <Icon name="zoom-in" size={24} color="white" />
                    </View>
                    <View style={styles.documentLabelContainer}>
                      <Icon name="credit-card" size={18} color="#007bff" />
                      <Text style={styles.documentLabel}>PAN Card</Text>
                      <View style={styles.verifiedBadge}>
                        <Icon name="verified" size={14} color="#28a745" />
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
                
                {userData.kyc.bankPassbookUrl && (
                  <TouchableOpacity 
                    style={styles.documentItem}
                    onPress={() => handleImageClick(userData.kyc.bankPassbookUrl, 'Bank Passbook')}
                    activeOpacity={0.8}
                  >
                    <Image 
                      source={{ uri: userData.kyc.bankPassbookUrl }} 
                      style={styles.documentImage}
                      onError={(error) => console.log('Image load error:', error)}
                    />
                    <View style={styles.documentOverlay}>
                      <Icon name="zoom-in" size={24} color="white" />
                    </View>
                    <View style={styles.documentLabelContainer}>
                      <Icon name="account-balance" size={18} color="#007bff" />
                      <Text style={styles.documentLabel}>Bank Passbook</Text>
                      <View style={styles.verifiedBadge}>
                        <Icon name="verified" size={14} color="#28a745" />
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noKycContainer}>
            <Icon name="info-outline" size={64} color="#ffc107" />
            <Text style={styles.noKycTitle}>KYC Not Completed</Text>
            <Text style={styles.noKycText}>Complete your KYC verification to unlock all features</Text>
            <TouchableOpacity style={styles.kycButton}>
              <Icon name="verified-user" size={18} color="white" style={styles.buttonIcon} />
              <Text style={styles.kycButtonText}>Start KYC Process</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderSupport = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.supportOptions}>
        <TouchableOpacity style={styles.supportOption} onPress={handleContactSupport}>
          <View style={styles.supportIconContainer}>
            <Icon name="headset-mic" size={24} color="#007bff" />
          </View>
          <View style={styles.supportTextContainer}>
            <Text style={styles.supportTitle}>Customer Support</Text>
            <Text style={styles.supportSubtitle}>24/7 assistance available</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.supportOption} onPress={() => navigation.navigate('Faqs')}>
          <View style={styles.supportIconContainer}>
            <Icon name="help-outline" size={24} color="#007bff" />
          </View>
          <View style={styles.supportTextContainer}>
            <Text style={styles.supportTitle}>FAQs</Text>
            <Text style={styles.supportSubtitle}>Frequently asked questions</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.supportOption} onPress={() => navigation.navigate('GameRules')}>
          <View style={styles.supportIconContainer}>
            <Icon name="menu-book" size={24} color="#007bff" />
          </View>
          <View style={styles.supportTextContainer}>
            <Text style={styles.supportTitle}>Game Rules</Text>
            <Text style={styles.supportSubtitle}>Learn how to play</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { paddingTop: 0 }]}>
      <StatusBar barStyle="light-content" backgroundColor="#007bff" translucent />
      
      {/* Header with Back Button */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>My Account</Text>
          <Text style={styles.headerSubtitle}>Manage your profile and settings</Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>

      {/* Bottom Tab Navigation */}
      <View style={[styles.bottomTabs, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.7}
        >
          <View style={styles.tabIconContainer}>
            <Icon 
              name="person" 
              size={22} 
              color={activeTab === 'profile' ? '#007bff' : '#8e8e93'} 
            />
          </View>
          <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'referral' && styles.activeTab]}
          onPress={() => setActiveTab('referral')}
          activeOpacity={0.7}
        >
          <View style={styles.tabIconContainer}>
            <Icon 
              name="share" 
              size={22} 
              color={activeTab === 'referral' ? '#007bff' : '#8e8e93'} 
            />
          </View>
          <Text style={[styles.tabText, activeTab === 'referral' && styles.activeTabText]}>Referral</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'account' && styles.activeTab]}
          onPress={() => setActiveTab('account')}
          activeOpacity={0.7}
        >
          <View style={styles.tabIconContainer}>
            <Icon 
              name="account-balance-wallet" 
              size={22} 
              color={activeTab === 'account' ? '#007bff' : '#8e8e93'} 
            />
          </View>
          <Text style={[styles.tabText, activeTab === 'account' && styles.activeTabText]}>Wallet</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'kyc' && styles.activeTab]}
          onPress={() => setActiveTab('kyc')}
          activeOpacity={0.7}
        >
          <View style={styles.tabIconContainer}>
            <Icon 
              name="verified-user" 
              size={22} 
              color={activeTab === 'kyc' ? '#007bff' : '#8e8e93'} 
            />
          </View>
          <Text style={[styles.tabText, activeTab === 'kyc' && styles.activeTabText]}>KYC</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'support' && styles.activeTab]}
          onPress={() => setActiveTab('support')}
          activeOpacity={0.7}
        >
          <View style={styles.tabIconContainer}>
            <Icon 
              name="help-outline" 
              size={22} 
              color={activeTab === 'support' ? '#007bff' : '#8e8e93'} 
            />
          </View>
          <Text style={[styles.tabText, activeTab === 'support' && styles.activeTabText]}>Help</Text>
        </TouchableOpacity>
      </View>

      {/* Full Screen Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.fullScreenModalOverlay}>
          <StatusBar barStyle="light-content" backgroundColor="rgba(0, 0, 0, 0.9)" translucent />
          
          <View style={[styles.fullScreenHeader, { paddingTop: insets.top + 10 }]}>
            <Text style={styles.fullScreenTitle}>{selectedImageTitle}</Text>
            <TouchableOpacity
              style={styles.fullScreenCloseButton}
              onPress={() => setShowImageModal(false)}
              activeOpacity={0.8}
            >
              <Icon name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.fullScreenImageContainer}>
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage }}
                style={styles.fullScreenImage}
                resizeMode="contain"
                onError={(error) => {
                  console.log('Modal image load error:', error);
                  Alert.alert('Error', 'Failed to load image');
                }}
              />
            ) : (
              <View style={styles.noImageContainer}>
                <Icon name="image-not-supported" size={64} color="#666" />
                <Text style={styles.noImageText}>Image not available</Text>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={styles.fullScreenTouchArea}
            onPress={() => setShowImageModal(false)}
            activeOpacity={1}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingBottom: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  backButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginRight: 40
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },

  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Profile Card
  profileCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 4,
    borderColor: 'white',
  },
  avatarText: {
    color: 'white',
    fontSize: 36,
    fontWeight: '700',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#28a745',
    borderWidth: 3,
    borderColor: 'white',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
    textAlign: 'center',
  },
  profilePhone: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
    marginBottom: 12,
  },
  profileDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIcon: {
    marginRight: 12,
    width: 24,
  },
  detailLabel: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '600',
    flex: 1,
  },
  detailValue: {
    fontSize: 15,
    color: '#212529',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1.2,
  },
  tokensBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokensBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },

  // Action Card
  actionCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  actionButton: {
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#212529',
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
    fontWeight: '400',
  },

  // Card Headers
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 2,
  },

  // Referral Cards
  referralCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  referralCodeContainer: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
    width: '100%',
    alignItems: 'center',
  },
  referralCode: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
    letterSpacing: 2,
    textAlign: 'center',
  },
  
  // Updated button styles for referral section
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  copyButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    flex: 0.48,
    justifyContent: 'center',
  },
  copyButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  shareButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    flex: 0.48,
    justifyContent: 'center',
  },
  shareButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  buttonIcon: {
    marginRight: 4,
  },

  // Account Overview
  overviewCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 28,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  tokenSummary: {
    alignItems: 'center',
    marginBottom: 28,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  tokenIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  tokenAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: '#212529',
    marginBottom: 4,
  },
  tokenLabel: {
    fontSize: 15,
    color: '#6c757d',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#007bff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 0.48,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 2,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  secondaryButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007bff',
    flex: 0.48,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Transaction History Button
  transactionButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007bff',
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  transactionButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },

  summaryCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  summaryContent: {
    marginTop: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },
  summaryValue: {
    fontSize: 15,
    color: '#212529',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },

  // KYC Section
  kycCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  kycHeader: {
    flexDirection: 'column',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  statusIcon: {
    marginRight: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  kycContent: {
    marginTop: 8,
  },
  kycInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
    marginBottom: 24,
  },
  kycInfoLabel: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },
  kycInfoValue: {
    fontSize: 15,
    color: '#212529',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  documentsSection: {
    marginTop: 8,
  },
  documentsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
    marginLeft: 8,
  },
  documentsContainer: {
    marginTop: 20,
  },
  documentItem: {
    width: '100%',
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e9ecef',
    position: 'relative',
    elevation: 2,
    backgroundColor: 'white',
  },
  documentImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#f8f9fa',
  },
  documentOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
  },
  documentLabel: {
    fontSize: 15,
    color: '#495057',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  verifiedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noKycContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noKycTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
    marginTop: 16,
    marginBottom: 8,
  },
  noKycText: {
    fontSize: 15,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  kycButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  kycButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },

  // Support Section
  supportOptions: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  supportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  supportIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  supportTextContainer: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#212529',
  },
  supportSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
    fontWeight: '400',
  },

  // Bottom Tab Navigation
  bottomTabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 8,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: 'rgba(0, 123, 255, 0.08)',
  },
  tabIconContainer: {
    marginBottom: 6,
  },
  tabText: {
    fontSize: 11,
    color: '#8e8e93',
    textAlign: 'center',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#007bff',
    fontWeight: '700',
  },

  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 32,
    fontWeight: '500',
    lineHeight: 24,
  },
  warningText: {
    fontSize: 16,
    color: '#ffc107',
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },

  // Full Screen Modal Styles
  fullScreenModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  fullScreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  fullScreenTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  fullScreenCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  fullScreenImage: {
    width: width - 40,
    height: height - 150,
    borderRadius: 12,
  },
  fullScreenTouchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  noImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noImageText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
  },
   bankDetailsButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#28a745',
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  bankDetailsButtonText: {
    color: '#28a745',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default MyAccount;