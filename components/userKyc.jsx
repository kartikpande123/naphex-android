import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  StatusBar,
  Platform,
  BackHandler,
  Modal,
} from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import Clipboard from '@react-native-clipboard/clipboard';
import API_BASE_URL from './ApiConfig';
import styles from './UserKycStyles';

const { width, height } = Dimensions.get('window');

// Generate user ID and referral ID functions
const generateUserId = () => {
  return 'USER' + Math.random().toString(36).substr(2, 9).toUpperCase();
};

const generateReferralId = () => {
  return 'REF' + Math.random().toString(36).substr(2, 6).toUpperCase();
};

// File validation function
const validateFile = (file) => {
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes

  if (!file) {
    return { isValid: false, error: 'Please select a file' };
  }

  if (file.fileSize > maxSize) {
    return { isValid: false, error: 'File size must be under 5MB' };
  }

  return { isValid: true, error: null };
};

// Custom Alert Component
const CustomAlert = ({ message, isError, visible, onClose }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <View style={styles.alertContainer}>
      <View style={[styles.alert, isError ? styles.alertError : styles.alertSuccess]}>
        <Icon 
          name={isError ? "close-circle" : "checkmark-circle"} 
          size={20} 
          color={isError ? "#dc2626" : "#059669"} 
        />
        <Text style={[styles.alertText, isError ? styles.alertTextError : styles.alertTextSuccess]}>
          {message}
        </Text>
      </View>
    </View>
  );
};

// Selfie Preview Modal Component
const SelfiePreviewModal = ({ visible, imageUri, onConfirm, onRetake, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      statusBarTranslucent={true}
    >
      <View style={styles.selfiePreviewModalOverlay}>
        <StatusBar backgroundColor="rgba(0,0,0,0.9)" barStyle="light-content" />
        <View style={styles.selfiePreviewContainer}>
          <View style={styles.selfiePreviewHeader}>
            <TouchableOpacity onPress={onClose} style={styles.selfiePreviewCloseBtn}>
              <Icon name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.selfiePreviewTitle}>Preview Your Selfie</Text>
            <View style={{ width: 40 }} />
          </View>
          
          {imageUri && (
            <View style={styles.selfieImageContainer}>
              <Image source={{ uri: imageUri }} style={styles.selfiePreviewImage} />
            </View>
          )}
          
          <View style={styles.selfiePreviewActions}>
            <TouchableOpacity style={styles.retakeSelfieBtn} onPress={onRetake}>
              <Icon name="camera-outline" size={20} color="white" />
              <Text style={styles.retakeSelfieText}>Retake</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.confirmSelfieBtn} onPress={onConfirm}>
              <Icon name="checkmark" size={20} color="white" />
              <Text style={styles.confirmSelfieText}>Use This Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const UserKyc = () => {
  const navigation = useNavigation();
  const [showPopup, setShowPopup] = useState(false);
  const [userId, setUserId] = useState('');
  const [referralId, setReferralId] = useState('');
  const [copiedUserId, setCopiedUserId] = useState(false);
  const [copiedRefId, setCopiedRefId] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', isError: false });
  const [isLoading, setIsLoading] = useState(false);
  const [signupData, setSignupData] = useState(null);
  const [showKYC, setShowKYC] = useState(false);
  const [kycCompleted, setKycCompleted] = useState(false);
  
  // Selfie states
  const [showSelfiePreview, setShowSelfiePreview] = useState(false);
  const [tempSelfieUri, setTempSelfieUri] = useState(null);

  // KYC State - Added selfie
  const [kycData, setKycData] = useState({
    aadharCard: null,
    panCard: null,
    bankPassbook: null,
    selfie: null
  });

  const [kycErrors, setKycErrors] = useState({
    aadharCard: '',
    panCard: '',
    bankPassbook: '',
    selfie: ''
  });

  const [uploadProgress, setUploadProgress] = useState({
    aadharCard: false,
    panCard: false,
    bankPassbook: false,
    selfie: false
  });

  useEffect(() => {
    const loadSignupData = async () => {
      try {
        const storedData = await AsyncStorage.getItem('signupData');
        if (storedData) {
          setSignupData(JSON.parse(storedData));
        } else {
          showAlert('No signup data found. Please sign up first.', true);
          setTimeout(() => navigation.navigate('Signup'), 2000);
        }
      } catch (error) {
        console.error('Error loading signup data:', error);
        showAlert('Error loading signup data', true);
      }
    };

    loadSignupData();
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (showPopup || showSelfiePreview) {
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [showPopup, showSelfiePreview]);

  const showAlert = (message, isError = false) => {
    setAlert({ show: true, message, isError });
  };

  const hideAlert = () => {
    setAlert({ show: false, message: '', isError: false });
  };

  const requestCameraPermission = async () => {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.CAMERA 
        : PERMISSIONS.ANDROID.CAMERA;

      const result = await request(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  };

  const requestStoragePermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const permission = Platform.Version >= 33 
          ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
          : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

        const result = await request(permission);
        return result === RESULTS.GRANTED;
      }
      return true;
    } catch (error) {
      console.error('Storage permission error:', error);
      return false;
    }
  };

  // Selfie capture function
  const captureSelfie = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      showAlert('Camera permission is required to take selfie', true);
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      cameraType: 'front', // Use front camera for selfie
      includeBase64: false,
      saveToPhotos: false,
    };

    launchCamera(options, (response) => {
      if (response.didCancel || response.error) {
        return;
      }

      if (response.assets && response.assets[0]) {
        setTempSelfieUri(response.assets[0].uri);
        setShowSelfiePreview(true);
      }
    });
  };

  const confirmSelfie = () => {
    if (tempSelfieUri) {
      const file = {
        uri: tempSelfieUri,
        type: 'image/jpeg',
        name: 'selfie.jpg',
        fileSize: 1024 * 1024, // Estimate 1MB
      };

      const validation = validateFile(file);

      if (!validation.isValid) {
        setKycErrors(prev => ({
          ...prev,
          selfie: validation.error
        }));
        setShowSelfiePreview(false);
        return;
      }

      setKycErrors(prev => ({
        ...prev,
        selfie: ''
      }));

      setUploadProgress(prev => ({
        ...prev,
        selfie: true
      }));

      setTimeout(() => {
        setKycData(prev => ({
          ...prev,
          selfie: file
        }));

        setUploadProgress(prev => ({
          ...prev,
          selfie: false
        }));

        setShowSelfiePreview(false);
        showAlert('Selfie captured successfully!', false);
      }, 1000);
    }
  };

  const retakeSelfie = () => {
    setShowSelfiePreview(false);
    setTimeout(() => {
      captureSelfie();
    }, 300);
  };

  const showImagePicker = (documentType) => {
    Alert.alert(
      'Select Image',
      'Choose an option to select image',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: () => openCamera(documentType) },
        { text: 'Gallery', onPress: () => openGallery(documentType) },
      ]
    );
  };

  const openCamera = async (documentType) => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      showAlert('Camera permission is required to take photos', true);
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchCamera(options, (response) => {
      if (response.didCancel || response.error) {
        return;
      }

      if (response.assets && response.assets[0]) {
        handleImageSelection(response.assets[0], documentType);
      }
    });
  };

  const openGallery = async (documentType) => {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      showAlert('Storage permission is required to access gallery', true);
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      selectionLimit: 1,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel || response.error) {
        return;
      }

      if (response.assets && response.assets[0]) {
        handleImageSelection(response.assets[0], documentType);
      }
    });
  };

  const handleImageSelection = (asset, documentType) => {
    const file = {
      uri: asset.uri,
      type: asset.type,
      name: asset.fileName || `${documentType}.jpg`,
      fileSize: asset.fileSize,
    };

    const validation = validateFile(file);

    if (!validation.isValid) {
      setKycErrors(prev => ({
        ...prev,
        [documentType]: validation.error
      }));
      return;
    }

    setKycErrors(prev => ({
      ...prev,
      [documentType]: ''
    }));

    setUploadProgress(prev => ({
      ...prev,
      [documentType]: true
    }));

    setTimeout(() => {
      setKycData(prev => ({
        ...prev,
        [documentType]: file
      }));

      setUploadProgress(prev => ({
        ...prev,
        [documentType]: false
      }));

      showAlert(`${documentType.charAt(0).toUpperCase() + documentType.slice(1)} uploaded successfully!`, false);
    }, 1000);
  };

  const handleKYCSubmit = () => {
    const { aadharCard, panCard, selfie } = kycData;

    // Bank passbook is now optional, only check for required documents
    if (!aadharCard || !panCard || !selfie) {
      showAlert('Please upload Aadhar Card, PAN Card, and take a selfie. Bank Passbook is optional.', true);
      return;
    }

    setKycCompleted(true);
    showAlert('KYC verification completed successfully!', false);
  };

  const startKYC = () => {
    setShowKYC(true);
  };

  const createAccount = async () => {
    setIsLoading(true);
    const newUserId = generateUserId();
    const newReferralId = generateReferralId();

    try {
      const signupDataFromStorage = await AsyncStorage.getItem('signupData');
      const signupData = JSON.parse(signupDataFromStorage) || {};

      if (!signupData?.name || !signupData?.phoneNo || !signupData?.password || !signupData?.city || !signupData?.state) {
        throw new Error('Required signup data is missing');
      }

      // Updated validation - bank passbook is now optional
      if (!kycData.aadharCard || !kycData.panCard || !kycData.selfie) {
        throw new Error('Aadhar Card, PAN Card, and Selfie are required. Bank Passbook is optional.');
      }

      console.log('=== CREATING FORM DATA ===');
      const formData = new FormData();

      // Add text fields
      formData.append('userId', newUserId);
      formData.append('name', signupData.name);
      formData.append('referralId', signupData.referralId || 'root');
      formData.append('myrefrelid', newReferralId);
      formData.append('phoneNo', signupData.phoneNo);
      formData.append('password', signupData.password);
      formData.append('email', signupData.email?.trim() || '');
      formData.append('city', signupData.city?.trim() || '');
      formData.append('state', signupData.state?.trim() || '');

      console.log('Text fields added to FormData');

      // CRITICAL: React Native requires specific file format
      // Add KYC files with proper React Native format
      const formatFileForRN = (fileData, defaultName) => {
        return {
          uri: fileData.uri,
          type: fileData.type || 'image/jpeg',
          name: fileData.name || defaultName,
        };
      };

      formData.append('aadharCard', formatFileForRN(kycData.aadharCard, 'aadhar.jpg'));
      formData.append('panCard', formatFileForRN(kycData.panCard, 'pan.jpg'));
      formData.append('selfie', formatFileForRN(kycData.selfie, 'selfie.jpg'));

      // Bank passbook is optional - only append if exists
      if (kycData.bankPassbook) {
        formData.append('bankPassbook', formatFileForRN(kycData.bankPassbook, 'passbook.jpg'));
        console.log('Bank Passbook added to FormData');
      } else {
        console.log('Bank Passbook not provided (optional)');
      }

      console.log('Files added to FormData');
      console.log('API URL:', `${API_BASE_URL}/registerUser`);

      // Send request - NO Content-Type header for React Native
      const response = await fetch(`${API_BASE_URL}/registerUser`, {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', JSON.stringify(response.headers));

      // Always get text first to handle both JSON and HTML
      const responseText = await response.text();
      console.log('Response text (first 500 chars):', responseText.substring(0, 500));

      if (!response.ok) {
        console.error('Server error response:', responseText);
        
        // Handle HTML error pages
        if (responseText.trim().startsWith('<')) {
          throw new Error(`Server error (${response.status}): The server returned an HTML error page. Check server logs for details.`);
        }
        
        // Try to parse JSON error
        try {
          const errorJson = JSON.parse(responseText);
          throw new Error(errorJson.error || errorJson.message || `Server error (${response.status})`);
        } catch (parseError) {
          throw new Error(`Server error (${response.status}): ${responseText.substring(0, 200)}`);
        }
      }

      // Parse successful response
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        throw new Error('Invalid response format from server');
      }

      if (!result.success) {
        throw new Error(result.error || result.message || 'Registration failed');
      }

      const responseUserId = result.userIdsData?.myuserid || newUserId;
      const responseReferralId = result.userIdsData?.myrefrelid || newReferralId;

      setUserId(responseUserId);
      setReferralId(responseReferralId);
      setShowPopup(true);
      showAlert('Account submitted for verification!', false);

      await AsyncStorage.removeItem('signupData');

    } catch (error) {
      console.error('Error creating account:', error);
      showAlert(error.message || 'Failed to create account. Please try again.', true);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      Clipboard.setString(text);
      
      if (type === 'userId') {
        setCopiedUserId(true);
        setTimeout(() => setCopiedUserId(false), 2000);
      } else {
        setCopiedRefId(true);
        setTimeout(() => setCopiedRefId(false), 2000);
      }

      showAlert(`${type === 'userId' ? 'User ID' : 'Referral ID'} copied to clipboard!`, false);
    } catch (err) {
      console.error('Failed to copy:', err);
      showAlert('Failed to copy to clipboard', true);
    }
  };

  const goToLogin = () => {
    navigation.navigate('Login');
  };

  const goToHelp = () => {
    navigation.navigate('Help');
  };

  const DocumentUpload = ({ documentType, label, iconName, isOptional = false }) => (
    <View style={styles.documentUpload}>
      <View style={styles.documentLabel}>
        <Icon name={iconName} size={18} color="#4F46E5" />
        <Text style={styles.documentLabelText}>{label}</Text>
        {isOptional && (
          <Text style={styles.optionalText}> (Optional)</Text>
        )}
      </View>
      
      <TouchableOpacity
        style={styles.uploadArea}
        onPress={() => showImagePicker(documentType)}
      >
        {uploadProgress[documentType] ? (
          <View style={styles.uploadProgress}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.uploadProgressText}>Uploading...</Text>
          </View>
        ) : kycData[documentType] ? (
          <View style={styles.uploadSuccess}>
            <Icon name="checkmark-circle" size={20} color="#059669" />
            <Text style={styles.uploadSuccessText}>
              {kycData[documentType].name}
            </Text>
            {kycData[documentType].uri && (
              <Image source={{ uri: kycData[documentType].uri }} style={styles.previewImage} />
            )}
          </View>
        ) : (
          <View style={styles.uploadPlaceholder}>
            <Icon name="cloud-upload-outline" size={24} color="#9CA3AF" />
            <Text style={styles.uploadPlaceholderText}>
              Tap to upload {label}
              {isOptional && ' (Optional)'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      
      {kycErrors[documentType] ? (
        <Text style={styles.errorText}>{kycErrors[documentType]}</Text>
      ) : null}
    </View>
  );

  // Selfie Capture Component
  const SelfieCapture = () => (
    <View style={styles.selfieSection}>
      <View style={styles.documentLabel}>
        <Icon name="camera" size={18} color="#4F46E5" />
        <Text style={styles.documentLabelText}>Live Selfie</Text>
      </View>
      
      <TouchableOpacity
        style={styles.selfieArea}
        onPress={captureSelfie}
      >
        {uploadProgress.selfie ? (
          <View style={styles.uploadProgress}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.uploadProgressText}>Processing...</Text>
          </View>
        ) : kycData.selfie ? (
          <View style={styles.selfieSuccess}>
            <Icon name="checkmark-circle" size={20} color="#059669" />
            <Text style={styles.uploadSuccessText}>Selfie captured!</Text>
            <Image source={{ uri: kycData.selfie.uri }} style={styles.selfiePreviewThumb} />
            <TouchableOpacity 
              style={styles.retakeSmallBtn} 
              onPress={captureSelfie}
            >
              <Icon name="camera-outline" size={16} color="#4F46E5" />
              <Text style={styles.retakeSmallText}>Retake</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.selfiePlaceholder}>
            <Icon name="camera" size={32} color="#4F46E5" />
            <Text style={styles.selfiePlaceholderTitle}>Take Live Selfie</Text>
            <Text style={styles.selfiePlaceholderText}>
              Tap to capture your live selfie for verification
            </Text>
          </View>
        )}
      </TouchableOpacity>
      
      {kycErrors.selfie ? (
        <Text style={styles.errorText}>{kycErrors.selfie}</Text>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#EBF4FF" barStyle="dark-content" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <Text style={styles.title}>KYC Verification</Text>
            <Text style={styles.subtitle}>Complete your verification to start trading</Text>
          </View>

          {(showKYC || kycCompleted) && (
            <View style={styles.importantNotice}>
              <View style={styles.importantNoticeContent}>
                <Icon name="warning" size={24} color="#856404" style={styles.importantNoticeIcon} />
                <View style={styles.importantNoticeTextContainer}>
                  <Text style={styles.importantNoticeTitle}>Important:</Text>
                  <Text style={styles.importantNoticeText}>
                    Please do not go back or close this screen during the KYC process. Your progress will be lost and you'll need to start over.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {!showKYC && !kycCompleted && (
            <View style={styles.kycIntro}>
              <View style={styles.kycIntroContent}>
                <Icon name="document-text" size={48} color="#4F46E5" />
                <Text style={styles.kycIntroTitle}>KYC Verification Required</Text>
                <Text style={styles.kycIntroText}>
                  Please complete your KYC verification to create your account and start trading.
                </Text>
                <TouchableOpacity style={styles.startKycBtn} onPress={startKYC}>
                  <Text style={styles.startKycBtnText}>Start KYC Verification</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {showKYC && !kycCompleted && (
            <View style={styles.kycForm}>
              <Text style={styles.kycTitle}>KYC Document Verification</Text>
              <Text style={styles.kycSubtitle}>
                Please upload the following documents and take a live selfie (Max 5MB each)
              </Text>

              <DocumentUpload
                documentType="aadharCard"
                label="Aadhar Card"
                iconName="person-outline"
              />

              <DocumentUpload
                documentType="panCard"
                label="PAN Card"
                iconName="card-outline"
              />

              <DocumentUpload
                documentType="bankPassbook"
                label="Bank Passbook"
                iconName="business-outline"
                isOptional={true}
              />

              {/* Selfie Capture Section */}
              <SelfieCapture />

              <TouchableOpacity
                style={[
                  styles.submitKycBtn,
                  (!kycData.aadharCard || !kycData.panCard || !kycData.selfie) && 
                  styles.submitKycBtnDisabled
                ]}
                onPress={handleKYCSubmit}
                disabled={!kycData.aadharCard || !kycData.panCard || !kycData.selfie}
              >
                <Text style={styles.submitKycBtnText}>Submit KYC Documents</Text>
              </TouchableOpacity>
            </View>
          )}

          {kycCompleted && (
            <View style={styles.accountCreation}>
              <View style={styles.kycSuccess}>
                <Icon name="checkmark-circle" size={48} color="#059669" />
                <Text style={styles.kycSuccessTitle}>KYC Submission Completed!</Text>
                <Text style={styles.kycSuccessText}>
                  Your documents and selfie have been uploaded successfully. You can now create your account.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.createAccountBtn, isLoading && styles.createAccountBtnDisabled]}
                onPress={createAccount}
                disabled={isLoading || !signupData}
              >
                <Icon name="wallet-outline" size={20} color="white" />
                <Text style={styles.createAccountBtnText}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Text>
                {isLoading && <ActivityIndicator size="small" color="white" style={{ marginLeft: 8 }} />}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Selfie Preview Modal */}
      <SelfiePreviewModal
        visible={showSelfiePreview}
        imageUri={tempSelfieUri}
        onConfirm={confirmSelfie}
        onRetake={retakeSelfie}
        onClose={() => setShowSelfiePreview(false)}
      />

      {/* Verification Success Popup */}
      {showPopup && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <LinearGradient
                colors={['#28a745', '#20c997']}
                style={styles.verificationHeader}
              >
                <Icon name="shield-checkmark" size={56} color="white" />
                <Text style={styles.modalTitle}>KYC Submission Successful!</Text>
                <Text style={styles.modalSubtitle}>
                  Your account is currently under admin verification
                </Text>
              </LinearGradient>

              <View style={styles.verificationContent}>
                {/* User ID Section */}
                <View style={styles.userIdBox}>
                  <View style={styles.userIdHeader}>
                    <Icon name="person-circle" size={26} color="#155724" />
                    <Text style={styles.userIdTitle}>Your User ID</Text>
                  </View>
                  
                  <View style={styles.idDisplayContainer}>
                    <View style={styles.userIdDisplay}>
                      <Text style={styles.userIdText}>{userId}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.copyButton, copiedUserId && styles.copyButtonSuccess]}
                      onPress={() => copyToClipboard(userId, 'userId')}
                    >
                      <Icon 
                        name={copiedUserId ? "checkmark" : "copy-outline"} 
                        size={18} 
                        color="white" 
                      />
                      <Text style={styles.copyButtonText}>
                        {copiedUserId ? "Copied!" : "Copy"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.userIdNote}>
                    Use this ID to check your account status on the login page
                  </Text>
                </View>

                {/* Referral ID Section */}
                <View style={styles.referralIdBox}>
                  <View style={styles.referralIdHeader}>
                    <Icon name="gift" size={26} color="#155724" />
                    <Text style={styles.referralIdTitle}>Your Referral ID</Text>
                  </View>
                  
                  <View style={styles.idDisplayContainer}>
                    <View style={styles.referralIdDisplay}>
                      <Text style={styles.referralIdText}>{referralId}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.copyButton, copiedRefId && styles.copyButtonSuccess]}
                      onPress={() => copyToClipboard(referralId, 'referralId')}
                    >
                      <Icon 
                        name={copiedRefId ? "checkmark" : "copy-outline"} 
                        size={18} 
                        color="white" 
                      />
                      <Text style={styles.copyButtonText}>
                        {copiedRefId ? "Copied!" : "Copy"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.referralIdNote}>
                    Share this ID with friends to earn referral bonuses
                  </Text>
                </View>

                <View style={styles.verificationStatus}>
                  <Icon name="time-outline" size={24} color="#D97706" />
                  <Text style={styles.verificationStatusText}>Under Admin Review</Text>
                </View>

                <View style={styles.timeline}>
                  <View style={styles.timelineItem}>
                    <Icon name="checkmark-circle" size={24} color="#28a745" />
                    <Text style={[styles.timelineText, { color: '#28a745' }]}>Account Created</Text>
                  </View>
                  <View style={styles.timelineItem}>
                    <Icon name="time" size={24} color="#ffc107" />
                    <Text style={[styles.timelineText, { color: '#856404' }]}>
                      Admin Verification (Up to 24 hours)
                    </Text>
                  </View>
                  <View style={styles.timelineItem}>
                    <Icon name="ellipse-outline" size={24} color="#6c757d" />
                    <Text style={[styles.timelineText, { color: '#6c757d' }]}>Account Activation</Text>
                  </View>
                </View>

                <View style={styles.importantNote}>
                  <Text style={styles.importantNoteTitle}>Important Information</Text>
                  <Text style={styles.importantNoteText}>
                    ⏰ Verification process takes up to 24 hours{'\n'}
                    🔐 Try logging in after 24 hours{'\n'}
                    📋 Save your User ID & Referral ID{'\n'}
                    ❓ No response? Contact admin through help section
                  </Text>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.loginBtn} onPress={goToLogin}>
                    <Icon name="search-outline" size={20} color="white" />
                    <Text style={styles.loginBtnText}>Check Status on Login</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.helpBtn} onPress={goToHelp}>
                    <Icon name="help-circle-outline" size={20} color="white" />
                    <Text style={styles.helpBtnText}>Help & Support</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Custom Alert */}
      <CustomAlert
        message={alert.message}
        isError={alert.isError}
        visible={alert.show}
        onClose={hideAlert}
      />
    </View>
  );
};

export default UserKyc;