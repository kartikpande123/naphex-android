import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  StatusBar,
  ToastAndroid,
  Image,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import API_BASE_URL from './ApiConfig';

const BankDetails = () => {
  const [userData, setUserData] = useState(null);
  const [bankDetails, setBankDetails] = useState(null);
  const [upiDetails, setUpiDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingBank, setEditingBank] = useState(false);
  const [editingUpi, setEditingUpi] = useState(false);
  const [showAddBank, setShowAddBank] = useState(false);
  const [showAddUpi, setShowAddUpi] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);

  // Form states
  const [bankForm, setBankForm] = useState({
    bankAccountNo: '',
    ifsc: '',
    bankingId: ''
  });
  
  const [upiForm, setUpiForm] = useState({
    upiId: '',
    bankingId: ''
  });

  // Document upload states
  const [documents, setDocuments] = useState({
    passbookPhoto: null,
    cancelledChequePhoto: null
  });

  const [documentPreviews, setDocumentPreviews] = useState({
    passbookPhoto: null,
    cancelledChequePhoto: null
  });

  // Track if documents already exist in database (from KYC)
  const [hasExistingDocuments, setHasExistingDocuments] = useState(false);

  // Get user data from AsyncStorage
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData);
          await fetchUserProfile(parsedData.phoneNo);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        ToastAndroid.show('Failed to load user data', ToastAndroid.SHORT);
      }
    };
    loadUserData();
  }, []);

  // Fetch user profile with banking details using JSON API
  const fetchUserProfile = async (phoneNo) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user-profile/json/${phoneNo}`);
      const data = await response.json();
      
      if (data.success && data.userData) {
        processUserData(data.userData);
      } else {
        ToastAndroid.show(data.message || 'Failed to load user profile', ToastAndroid.SHORT);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      ToastAndroid.show('Failed to load user profile', ToastAndroid.SHORT);
    } finally {
      setLoading(false);
    }
  };

  // Process user data to separate bank and UPI details
  const processUserData = (data) => {
    if (data.bankingDetails) {
      const bankingEntries = Object.entries(data.bankingDetails);
      
      // Separate bank details and UPI details
      const bankEntry = bankingEntries.find(([_, details]) => 
        details.bankAccountNo && details.ifsc
      );
      const upiEntry = bankingEntries.find(([_, details]) => 
        details.upiId
      );

      if (bankEntry) {
        setBankDetails({ ...bankEntry[1], bankingId: bankEntry[0] });
      }
      if (upiEntry) {
        setUpiDetails({ ...upiEntry[1], bankingId: upiEntry[0] });
      }
    }

    // Check if documents exist in KYC first (from registration)
    let hasKycDocs = false;
    if (data.kyc) {
      if (data.kyc.bankPassbookUrl) {
        setDocumentPreviews(prev => ({ ...prev, passbookPhoto: data.kyc.bankPassbookUrl }));
        hasKycDocs = true;
      }
      if (data.kyc.cancelledChequeUrl) {
        setDocumentPreviews(prev => ({ ...prev, cancelledChequePhoto: data.kyc.cancelledChequeUrl }));
        hasKycDocs = true;
      }
    }

    // Check if documents uploaded from in-game
    if (data.kyc) {
      if (data.kyc.bankPassbookUrlByInGame) {
        setDocumentPreviews(prev => ({ ...prev, passbookPhoto: data.kyc.bankPassbookUrlByInGame }));
        hasKycDocs = true;
      }
      if (data.kyc.cancelledChequeUrlByInGame) {
        setDocumentPreviews(prev => ({ ...prev, cancelledChequePhoto: data.kyc.cancelledChequeUrlByInGame }));
        hasKycDocs = true;
      }
    }

    // Set flag to hide upload section if documents already exist in database
    setHasExistingDocuments(hasKycDocs);
  };

  // Request permissions
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

  // Show image picker options
  const showImagePicker = (documentType) => {
    Alert.alert(
      'Select Image',
      'Choose an option to select document',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: () => openCamera(documentType) },
        { text: 'Gallery', onPress: () => openGallery(documentType) },
      ]
    );
  };

  // Open camera
  const openCamera = async (documentType) => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      ToastAndroid.show('Camera permission is required', ToastAndroid.SHORT);
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

  // Open gallery
  const openGallery = async (documentType) => {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      ToastAndroid.show('Storage permission is required', ToastAndroid.SHORT);
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

  // Handle image selection
  const handleImageSelection = (asset, documentType) => {
    // Validate file size (max 5MB)
    if (asset.fileSize > 5 * 1024 * 1024) {
      ToastAndroid.show('File size should not exceed 5MB', ToastAndroid.SHORT);
      return;
    }

    const file = {
      uri: asset.uri,
      type: asset.type || 'image/jpeg',
      name: asset.fileName || `${documentType}.jpg`,
      fileSize: asset.fileSize,
    };

    // Update documents state
    setDocuments(prev => ({ ...prev, [documentType]: file }));
    setDocumentPreviews(prev => ({ ...prev, [documentType]: asset.uri }));
    
    ToastAndroid.show(`${documentType === 'passbookPhoto' ? 'Passbook' : 'Cheque'} photo selected`, ToastAndroid.SHORT);
  };

  // Remove selected file
  const removeFile = (documentType) => {
    setDocuments(prev => ({ ...prev, [documentType]: null }));
    setDocumentPreviews(prev => ({ ...prev, [documentType]: null }));
  };

  // Upload documents
  const handleUploadDocuments = async () => {
    if (!documents.passbookPhoto && !documents.cancelledChequePhoto) {
      ToastAndroid.show('Please select at least one document to upload', ToastAndroid.SHORT);
      return;
    }

    if (!userData?.phoneNo) {
      ToastAndroid.show('User information not found', ToastAndroid.SHORT);
      return;
    }

    setUploadingDocuments(true);

    try {
      const formData = new FormData();
      formData.append('phoneNo', userData.phoneNo);
      
      if (documents.passbookPhoto) {
        formData.append('passbookPhoto', {
          uri: documents.passbookPhoto.uri,
          type: documents.passbookPhoto.type,
          name: documents.passbookPhoto.name,
        });
      }
      if (documents.cancelledChequePhoto) {
        formData.append('cancelledChequePhoto', {
          uri: documents.cancelledChequePhoto.uri,
          type: documents.cancelledChequePhoto.type,
          name: documents.cancelledChequePhoto.name,
        });
      }

      const response = await fetch(`${API_BASE_URL}/banking/upload-documents`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        ToastAndroid.show('Documents uploaded successfully!', ToastAndroid.SHORT);
        // Mark that documents now exist in database
        setHasExistingDocuments(true);
        // Keep the previews but clear the file objects
        setDocuments({ passbookPhoto: null, cancelledChequePhoto: null });
      } else {
        ToastAndroid.show('Failed to upload documents: ' + result.error, ToastAndroid.LONG);
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      ToastAndroid.show('Failed to upload documents', ToastAndroid.SHORT);
    } finally {
      setUploadingDocuments(false);
    }
  };

  // Add new bank details
  const handleAddBank = async () => {
    if (!userData?.phoneNo || !bankForm.bankAccountNo || !bankForm.ifsc) {
      ToastAndroid.show('Please fill in all bank details', ToastAndroid.SHORT);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/banking/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNo: userData.phoneNo,
          bankAccountNo: bankForm.bankAccountNo,
          ifsc: bankForm.ifsc
        })
      });

      const result = await response.json();
      if (result.success) {
        setBankDetails({
          bankAccountNo: bankForm.bankAccountNo,
          ifsc: bankForm.ifsc,
          bankingId: result.bankingId,
          createdAt: Date.now(),
          status: 'unverified'
        });
        setBankForm({ bankAccountNo: '', ifsc: '', bankingId: '' });
        setShowAddBank(false);
        ToastAndroid.show('Bank details added successfully!', ToastAndroid.SHORT);
      } else {
        ToastAndroid.show('Failed to add bank details: ' + result.error, ToastAndroid.LONG);
      }
    } catch (error) {
      console.error('Error adding bank details:', error);
      ToastAndroid.show('Failed to add bank details', ToastAndroid.SHORT);
    }
  };

  // Add new UPI details
  const handleAddUpi = async () => {
    if (!userData?.phoneNo || !upiForm.upiId) {
      ToastAndroid.show('Please enter UPI ID', ToastAndroid.SHORT);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/banking/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNo: userData.phoneNo,
          upiId: upiForm.upiId
        })
      });

      const result = await response.json();
      if (result.success) {
        setUpiDetails({
          upiId: upiForm.upiId,
          bankingId: result.bankingId,
          createdAt: Date.now(),
          status: 'unverified'
        });
        setUpiForm({ upiId: '', bankingId: '' });
        setShowAddUpi(false);
        ToastAndroid.show('UPI details added successfully!', ToastAndroid.SHORT);
      } else {
        ToastAndroid.show('Failed to add UPI details: ' + result.error, ToastAndroid.LONG);
      }
    } catch (error) {
      console.error('Error adding UPI details:', error);
      ToastAndroid.show('Failed to add UPI details', ToastAndroid.SHORT);
    }
  };

  // Edit bank details
  const handleEditBank = async () => {
    if (!userData?.phoneNo || !bankForm.bankingId) {
      ToastAndroid.show('Missing required information', ToastAndroid.SHORT);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/banking/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNo: userData.phoneNo,
          bankingId: bankForm.bankingId,
          bankAccountNo: bankForm.bankAccountNo,
          ifsc: bankForm.ifsc,
          status: 'unverified'
        })
      });

      const result = await response.json();
      if (result.success) {
        setBankDetails(prev => ({
          ...prev,
          bankAccountNo: bankForm.bankAccountNo,
          ifsc: bankForm.ifsc,
          status: 'unverified'
        }));
        setEditingBank(false);
        ToastAndroid.show('Bank details updated successfully! Status set to unverified for admin review.', ToastAndroid.LONG);
      } else {
        ToastAndroid.show('Failed to update bank details: ' + result.error, ToastAndroid.LONG);
      }
    } catch (error) {
      console.error('Error updating bank details:', error);
      ToastAndroid.show('Failed to update bank details', ToastAndroid.SHORT);
    }
  };

  // Edit UPI details
  const handleEditUpi = async () => {
    if (!userData?.phoneNo || !upiForm.bankingId) {
      ToastAndroid.show('Missing required information', ToastAndroid.SHORT);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/banking/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNo: userData.phoneNo,
          bankingId: upiForm.bankingId,
          upiId: upiForm.upiId,
          status: 'unverified'
        })
      });

      const result = await response.json();
      if (result.success) {
        setUpiDetails(prev => ({
          ...prev,
          upiId: upiForm.upiId,
          status: 'unverified'
        }));
        setEditingUpi(false);
        ToastAndroid.show('UPI details updated successfully! Status set to unverified for admin review.', ToastAndroid.LONG);
      } else {
        ToastAndroid.show('Failed to update UPI details: ' + result.error, ToastAndroid.LONG);
      }
    } catch (error) {
      console.error('Error updating UPI details:', error);
      ToastAndroid.show('Failed to update UPI details', ToastAndroid.SHORT);
    }
  };

  // Start editing bank details
  const startEditingBank = () => {
    setBankForm({
      bankAccountNo: bankDetails.bankAccountNo,
      ifsc: bankDetails.ifsc,
      bankingId: bankDetails.bankingId
    });
    setEditingBank(true);
  };

  // Start editing UPI details
  const startEditingUpi = () => {
    setUpiForm({
      upiId: upiDetails.upiId,
      bankingId: upiDetails.bankingId
    });
    setEditingUpi(true);
  };

  const cancelBankForm = () => {
    setShowAddBank(false);
    setEditingBank(false);
    setBankForm({ bankAccountNo: '', ifsc: '', bankingId: '' });
  };

  const cancelUpiForm = () => {
    setShowAddUpi(false);
    setEditingUpi(false);
    setUpiForm({ upiId: '', bankingId: '' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar backgroundColor="#2563eb" barStyle="light-content" />
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading your banking details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar backgroundColor="#2563eb" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            <Icon name="shield" size={28} color="white" />
            <Text style={styles.headerTitle}>Banking Details</Text>
          </View>
          <Text style={styles.headerSubtitle}>Manage your payment methods securely</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Document Upload Section - Only show if documents don't exist in database */}
        {!hasExistingDocuments && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderContent}>
                <Icon name="file-text" size={20} color="white" />
                <Text style={styles.cardHeaderTitle}>Bank Documents</Text>
                <View style={[styles.badge, styles.badgeInfo, { marginLeft: 8 }]}>
                  <Text style={styles.badgeTextDark}>Upload One or Both</Text>
                </View>
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.alertInfo}>
                <Icon name="alert-circle" size={20} color="#3b82f6" />
                <Text style={styles.alertInfoText}>
                  You can upload either Bank Passbook OR Cancelled Cheque, or both documents for verification.
                </Text>
              </View>

              {/* Bank Passbook Photo */}
              <View style={styles.documentSection}>
                <Text style={styles.documentLabel}>Bank Passbook Photo</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => showImagePicker('passbookPhoto')}
                >
                  <Icon name="upload" size={16} color="#2563eb" />
                  <Text style={styles.uploadButtonText}>Choose File</Text>
                </TouchableOpacity>
                <Text style={styles.documentHint}>
                  Accepted formats: JPG, PNG (Max 5MB)
                </Text>

                {documentPreviews.passbookPhoto && (
                  <View style={styles.previewContainer}>
                    <Image
                      source={{ uri: documentPreviews.passbookPhoto }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeFile('passbookPhoto')}
                    >
                      <Icon name="x" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Cancelled Cheque Photo */}
              <View style={styles.documentSection}>
                <Text style={styles.documentLabel}>Cancelled Cheque Photo</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => showImagePicker('cancelledChequePhoto')}
                >
                  <Icon name="upload" size={16} color="#2563eb" />
                  <Text style={styles.uploadButtonText}>Choose File</Text>
                </TouchableOpacity>
                <Text style={styles.documentHint}>
                  Accepted formats: JPG, PNG (Max 5MB)
                </Text>

                {documentPreviews.cancelledChequePhoto && (
                  <View style={styles.previewContainer}>
                    <Image
                      source={{ uri: documentPreviews.cancelledChequePhoto }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeFile('cancelledChequePhoto')}
                    >
                      <Icon name="x" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.uploadDocumentsButton,
                  (uploadingDocuments || (!documents.passbookPhoto && !documents.cancelledChequePhoto)) && styles.disabledButton
                ]}
                onPress={handleUploadDocuments}
                disabled={uploadingDocuments || (!documents.passbookPhoto && !documents.cancelledChequePhoto)}
              >
                {uploadingDocuments ? (
                  <>
                    <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.uploadDocumentsButtonText}>Uploading...</Text>
                  </>
                ) : (
                  <>
                    <Icon name="upload" size={16} color="white" />
                    <Text style={styles.uploadDocumentsButtonText}>Upload Documents</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bank Details Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderContent}>
              <Icon name="credit-card" size={20} color="white" />
              <Text style={styles.cardHeaderTitle}>Bank Account Details</Text>
              <View style={[styles.badge, bankDetails ? styles.badgeSuccess : styles.badgeWarning]}>
                <Icon 
                  name={bankDetails ? "check-circle" : "alert-circle"} 
                  size={14} 
                  color={bankDetails ? "white" : "#8b5cf6"} 
                />
                <Text style={[styles.badgeText, bankDetails ? styles.badgeTextWhite : styles.badgeTextDark]}>
                  {bankDetails ? 'Added' : 'Not Added'}
                </Text>
              </View>
              {bankDetails && (
                <View style={[styles.badge, styles.badgeWarning, { marginLeft: 8 }]}>
                  <Text style={styles.badgeTextDark}>
                    {bankDetails.status === 'verified' ? 'Verified' : 'Unverified'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.cardBody}>
            {!bankDetails && !showAddBank ? (
              <View style={styles.emptyState}>
                <Icon name="credit-card" size={48} color="#9ca3af" />
                <Text style={styles.emptyStateTitle}>No bank account details added</Text>
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={() => setShowAddBank(true)}
                >
                  <Icon name="plus" size={16} color="white" />
                  <Text style={styles.primaryButtonText}>Add Bank Details</Text>
                </TouchableOpacity>
              </View>
            ) : bankDetails && !editingBank ? (
              <View>
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Account Number</Text>
                    <Text style={styles.detailValue}>{bankDetails.bankAccountNo}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>IFSC Code</Text>
                    <Text style={styles.detailValue}>{bankDetails.ifsc}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.outlineButton}
                  onPress={startEditingBank}
                >
                  <Icon name="edit" size={16} color="#2563eb" />
                  <Text style={styles.outlineButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={styles.formRow}>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Account Number</Text>
                    <TextInput
                      style={styles.formInput}
                      value={bankForm.bankAccountNo}
                      onChangeText={(text) => setBankForm(prev => ({ ...prev, bankAccountNo: text }))}
                      placeholder="Enter account number"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>IFSC Code</Text>
                    <TextInput
                      style={styles.formInput}
                      value={bankForm.ifsc}
                      onChangeText={(text) => setBankForm(prev => ({ ...prev, ifsc: text }))}
                      placeholder="Enter IFSC code"
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    style={styles.successButton}
                    onPress={showAddBank ? handleAddBank : handleEditBank}
                  >
                    <Text style={styles.successButtonText}>
                      {showAddBank ? 'Add Details' : 'Update Details'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.secondaryButton}
                    onPress={cancelBankForm}
                  >
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* UPI Details Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderContent}>
              <Icon name="smartphone" size={20} color="white" />
              <Text style={styles.cardHeaderTitle}>UPI Details</Text>
              <View style={[styles.badge, upiDetails ? styles.badgeSuccess : styles.badgeWarning]}>
                <Icon 
                  name={upiDetails ? "check-circle" : "alert-circle"} 
                  size={14} 
                  color={upiDetails ? "white" : "#8b5cf6"} 
                />
                <Text style={[styles.badgeText, upiDetails ? styles.badgeTextWhite : styles.badgeTextDark]}>
                  {upiDetails ? 'Added' : 'Not Added'}
                </Text>
              </View>
              {upiDetails && (
                <View style={[styles.badge, styles.badgeWarning, { marginLeft: 8 }]}>
                  <Text style={styles.badgeTextDark}>
                    {upiDetails.status === 'verified' ? 'Verified' : 'Unverified'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.cardBody}>
            {!upiDetails && !showAddUpi ? (
              <View style={styles.emptyState}>
                <Icon name="smartphone" size={48} color="#9ca3af" />
                <Text style={styles.emptyStateTitle}>No UPI ID added</Text>
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={() => setShowAddUpi(true)}
                >
                  <Icon name="plus" size={16} color="white" />
                  <Text style={styles.primaryButtonText}>Add UPI ID</Text>
                </TouchableOpacity>
              </View>
            ) : upiDetails && !editingUpi ? (
              <View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>UPI ID</Text>
                  <Text style={styles.detailValue}>{upiDetails.upiId}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.outlineButton}
                  onPress={startEditingUpi}
                >
                  <Icon name="edit" size={16} color="#2563eb" />
                  <Text style={styles.outlineButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>UPI ID</Text>
                  <TextInput
                    style={styles.formInput}
                    value={upiForm.upiId}
                    onChangeText={(text) => setUpiForm(prev => ({ ...prev, upiId: text }))}
                    placeholder="Enter UPI ID (e.g., user@upi)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    style={styles.successButton}
                    onPress={showAddUpi ? handleAddUpi : handleEditUpi}
                  >
                    <Text style={styles.successButtonText}>
                      {showAddUpi ? 'Add UPI ID' : 'Update UPI ID'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.secondaryButton}
                    onPress={cancelUpiForm}
                  >
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Icon name="shield" size={18} color="#2563eb" />
            <Text style={styles.infoHeaderTitle}>Important Information</Text>
          </View>
          <View style={styles.infoContent}>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>Your banking details are securely stored and encrypted</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>All details show as "Unverified" until manually verified by admin</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>Upload clear photos of your bank passbook and cancelled cheque for verification</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>You can edit your details anytime, but cannot delete them once added</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>Both bank account and UPI details are independent payment methods</Text>
            </View>
          </View>
        </View>
      </View>
      
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#2563eb',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 12,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    backgroundColor: '#2563eb',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  cardHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  cardHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginLeft: 12,
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeSuccess: {
    backgroundColor: '#10b981',
  },
  badgeWarning: {
    backgroundColor: '#fbbf24',
  },
  badgeInfo: {
    backgroundColor: '#3b82f6',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  badgeTextWhite: {
    color: 'white',
  },
  badgeTextDark: {
    color: '#1f2937',
  },
  cardBody: {
    padding: 20,
  },
  alertInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  alertInfoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  documentSection: {
    marginBottom: 20,
  },
  documentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  uploadButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  documentHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  previewContainer: {
    position: 'relative',
    marginTop: 12,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadDocumentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
  },
  uploadDocumentsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  detailsRow: {
    marginBottom: 20,
  },
  detailItem: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  outlineButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  formRow: {
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 8,
    fontWeight: '500',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: 'white',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  successButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
  },
  successButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
    marginLeft: 8,
  },
  infoContent: {
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  infoBullet: {
    color: '#2563eb',
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#2563eb',
    lineHeight: 20,
  },
});

export default BankDetails;