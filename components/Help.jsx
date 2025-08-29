import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  Linking,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import API_BASE_URL from './ApiConfig';

const { width } = Dimensions.get('window');

const Help = () => {
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    userId: '',
    description: '',
    photo: null
  });

  const blinkAnimation = useRef(new Animated.Value(1)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Blinking animation for Live Chat
    const blinkLoop = () => {
      Animated.sequence([
        Animated.timing(blinkAnimation, {
          toValue: 0.5,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnimation, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => blinkLoop());
    };
    blinkLoop();
  }, []);

  const handleChange = (name, value) => {
    // Special handling for phone number to only allow digits
    if (name === 'number') {
      // Remove any non-digit characters and limit to 10 digits
      const numericValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prevState => ({
        ...prevState,
        [name]: numericValue
      }));
    } else {
      setFormData(prevState => ({
        ...prevState,
        [name]: value
      }));
    }
  };

  const requestCameraPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const permission = Platform.Version >= 33 
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

        const granted = await PermissionsAndroid.request(permission, {
          title: 'Photo Library Permission',
          message: 'This app needs access to your photo library to upload images.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        });

        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const permission = PERMISSIONS.IOS.PHOTO_LIBRARY;
        const result = await check(permission);
        
        if (result === RESULTS.DENIED) {
          const requestResult = await request(permission);
          return requestResult === RESULTS.GRANTED;
        }
        
        return result === RESULTS.GRANTED;
      }
    } catch (err) {
      console.warn('Permission error:', err);
      return false;
    }
  };

  const handleImagePicker = async () => {
    const hasPermission = await requestCameraPermission();
    
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Please grant photo library permission to upload images.',
        [{ text: 'OK' }]
      );
      return;
    }

    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel || response.error) {
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        
        // Check file size (20MB limit)
        if (asset.fileSize > 20 * 1024 * 1024) {
          Alert.alert('File Size Error', 'File is too large. Maximum file size is 20MB.');
          return;
        }

        setFormData(prevState => ({
          ...prevState,
          photo: {
            uri: asset.uri,
            type: asset.type,
            name: asset.fileName || 'image.jpg',
            size: asset.fileSize
          }
        }));
      }
    });
  };

  const handleWhatsAppRedirect = async () => {
  const phoneNumber = '919019842426';
  const message = 'Hello, I need help with my query.';
  
  // Primary WhatsApp URL - this works on most devices
  const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
  
  try {
    // Try to open WhatsApp directly
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    
    if (canOpen) {
      await Linking.openURL(whatsappUrl);
    } else {
      // If WhatsApp app is not installed, open web version
      const webWhatsAppUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      await Linking.openURL(webWhatsAppUrl);
    }
  } catch (error) {
    console.error('Error opening WhatsApp:', error);
    // Fallback to web WhatsApp if there's any error
    const webWhatsAppUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    Linking.openURL(webWhatsAppUrl);
  }
};

  const handleSubmit = async () => {
    try {
      // Enhanced phone number validation
      if (formData.number.length !== 10) {
        Alert.alert('Validation Error', 'Please enter a valid 10-digit phone number');
        return;
      }

      // Basic client-side validation
      if (!formData.name || !formData.number || !formData.description) {
        Alert.alert('Validation Error', 'Please fill in all required fields (Name, Contact Number, and Description)');
        return;
      }

      // Create FormData for multipart/form-data upload
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('number', formData.number);
      formDataToSend.append('description', formData.description);

      // Add optional fields
      if (formData.userId) {
        formDataToSend.append('userId', formData.userId);
      }

      // Add photo if exists
      if (formData.photo) {
        formDataToSend.append('photo', formData.photo);
      }

      // Make the API call
      const response = await fetch(`${API_BASE_URL}/help-request`, {
        method: 'POST',
        body: formDataToSend,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit form');
      }

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Help request submitted successfully!');

        // Reset form
        setFormData({
          name: '',
          number: '',
          userId: '',
          description: '',
          photo: null
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      Alert.alert('Error', `Error: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.formContainer,
            { opacity: fadeAnimation }
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.headerText}>Help & Support</Text>
          </View>

          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Your Name <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.textInput}
              placeholder="Your Name"
              value={formData.name}
              onChangeText={(value) => handleChange('name', value)}
              placeholderTextColor="#999"
            />
          </View>

          {/* Contact Number Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contact Number <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.textInput}
              placeholder="10-digit Contact Number"
              value={formData.number}
              onChangeText={(value) => handleChange('number', value)}
              keyboardType="numeric"
              maxLength={10}
              placeholderTextColor="#999"
            />
            {formData.number.length > 0 && formData.number.length !== 10 && (
              <Text style={styles.errorText}>
                Please enter a 10-digit phone number
              </Text>
            )}
          </View>

          {/* User ID Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>User ID (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="User ID"
              value={formData.userId}
              onChangeText={(value) => handleChange('userId', value)}
              placeholderTextColor="#999"
            />
          </View>

          {/* Description Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Describe Your Concern"
              value={formData.description}
              onChangeText={(value) => handleChange('description', value)}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#999"
            />
          </View>

          {/* Photo Upload */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Upload Image (Optional)</Text>
            <TouchableOpacity 
              style={styles.photoButton}
              onPress={handleImagePicker}
            >
              <Text style={styles.photoButtonText}>
                {formData.photo ? 'Change Photo' : 'Select Photo'}
              </Text>
            </TouchableOpacity>
            {formData.photo && (
              <View style={styles.photoPreview}>
                <Image source={{ uri: formData.photo.uri }} style={styles.previewImage} />
                <Text style={styles.photoName}>{formData.photo.name}</Text>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>Submit Concern</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* WhatsApp Live Chat */}
      <View style={styles.whatsappContainer}>
        <TouchableOpacity 
          style={styles.whatsappButton}
          onPress={handleWhatsAppRedirect}
          activeOpacity={0.8}
        >
          <Animated.Text 
            style={[
              styles.liveChatText,
              { opacity: blinkAnimation }
            ]}
          >
            Live Chat
          </Animated.Text>
          <View style={styles.whatsappIcon}>
            <Text style={styles.whatsappIconText}>💬</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  formContainer: {
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0056b3',
    letterSpacing: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  required: {
    color: '#dc3545',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#6cb2eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
  },
  photoButton: {
    borderWidth: 1,
    borderColor: '#6cb2eb',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  photoButtonText: {
    color: '#0056b3',
    fontSize: 16,
    fontWeight: '500',
  },
  photoPreview: {
    marginTop: 10,
    alignItems: 'center',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 5,
  },
  photoName: {
    fontSize: 12,
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#0056b3',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  whatsappContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'center',
  },
  whatsappButton: {
    alignItems: 'center',
  },
  liveChatText: {
    backgroundColor: '#ffffff',
    color: '#28a745',
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  whatsappIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#25D366',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  whatsappIconText: {
    fontSize: 30,
  },
});

export default Help;