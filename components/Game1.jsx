import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  Modal,
  Animated,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
  Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import EventSource from 'event-source-polyfill';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from './Game1Styles';

// Import your images here - adjust paths as needed
import picture1 from '../images/picture-1.png';
import picture2 from '../images/picture-2.png';
import picture3 from '../images/picture-3.png';
import picture4 from '../images/picture-4.png';
import picture5 from '../images/picture-5.png';
import picture6 from '../images/picture-6.png';
import picture7 from '../images/picture-7.png';
import picture8 from '../images/picture-8.png';
import picture9 from '../images/picture-9.png';
import picture0 from '../images/picture-0.png';
import API_BASE_URL from './ApiConfig';

const { width, height } = Dimensions.get('window');

const imageToNumber = {
  [picture1]: 1,
  [picture2]: 2,
  [picture3]: 3,
  [picture4]: 4,
  [picture5]: 5,
  [picture6]: 6,
  [picture7]: 7,
  [picture8]: 8,
  [picture9]: 9,
  [picture0]: 0,
};

const images = [
  picture1,
  picture2,
  picture3,
  picture4,
  picture5,
  picture6,
  picture7,
  picture8,
  picture9,
  picture0,
];

const sessionTimings = [
  {
    label: 'Session 1',
    start: '10:00 AM',
    end: '5:00 PM',
    breaks: [
      {
        time: '2:00 PM',
        disabledModes: ['3-fruits-start', '1-fruits-start', '2-fruits'],
      },
    ],
  },
  {
    label: 'Session 2',
    start: '5:00 PM',
    end: '11:45 PM',
    breaks: [
      {
        time: '9:00 PM',
        disabledModes: ['3-fruits-start', '1-fruits-start', '2-fruits'],
      },
    ],
  },
];

const choiceModes = [
  { key: '3-fruits-start', label: '3 FRUITS START' },
  { key: '1-fruits-start', label: '1 FRUITS START' },
  { key: '3-fruits-end', label: '3 FRUITS END' },
  { key: '1-fruits-end', label: '1 FRUITS END' },
  { key: '2-fruits', label: '2 FRUITS' },
];

const OpenCloseGame = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [choiceMode, setChoiceMode] = useState('');
  const [betAmount, setBetAmount] = useState('');
  const [tokenCount, setTokenCount] = useState(397700.0);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('info');
  const [sessionCountdowns, setSessionCountdowns] = useState({});
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const scrollViewRef = useRef(null);

  // NEW ANIMATION REFS
  const glowAnim = useRef(new Animated.Value(0)).current;
  const titleBounceAnim = useRef(new Animated.Value(1)).current;
  const headerSlideAnim = useRef(new Animated.Value(-100)).current;
  const sessionAnimations = useRef(
    sessionTimings.map(() => new Animated.Value(0)),
  ).current;
  const choiceModeAnimations = useRef(
    choiceModes.map(() => new Animated.Value(0)),
  ).current;
  const imageAnimations = useRef(
    images.map(() => new Animated.Value(0)),
  ).current;
  const betSectionAnim = useRef(new Animated.Value(0)).current;
  const tokenCountAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // INITIALIZE ANIMATIONS ON MOUNT
  useEffect(() => {
    // Header slide in animation
    Animated.timing(headerSlideAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Continuous glow animation for title
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ]),
    );
    glowLoop.start();

    // Staggered animations for sessions
    const sessionStagger = Animated.stagger(
      200,
      sessionAnimations.map(anim =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ),
    );

    // Staggered animations for choice modes
    const choiceModeStagger = Animated.stagger(
      100,
      choiceModeAnimations.map(anim =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ),
    );

    // Staggered animations for images
    const imageStagger = Animated.stagger(
      50,
      imageAnimations.map(anim =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ),
    );

    // Bet section animation
    Animated.timing(betSectionAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();

    // Start all staggered animations with delays
    setTimeout(() => sessionStagger.start(), 300);
    setTimeout(() => choiceModeStagger.start(), 800);
    setTimeout(() => imageStagger.start(), 1200);

    // Continuous pulse animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoop.start();

    return () => {
      glowLoop.stop();
      pulseLoop.stop();
    };
  }, []);

  // ANIMATE TOKEN COUNT CHANGES
  useEffect(() => {
    Animated.sequence([
      Animated.timing(tokenCountAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(tokenCountAnim, {
        toValue: 1,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  }, [tokenCount]);

  // ANIMATE TITLE BOUNCE ON INTERACTION
  const animateTitleBounce = () => {
    Animated.sequence([
      Animated.timing(titleBounceAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(titleBounceAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // EventSource setup for token updates
  useEffect(() => {
    let eventSource = null;

    const connectToTokenUpdates = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        const userData = JSON.parse(userDataString);
        if (!userData || !userData.phoneNo) return;

        eventSource = new EventSource(
          `${API_BASE_URL}/user-profile/${userData.phoneNo}`,
        );

        eventSource.onmessage = async event => {
          try {
            const data = JSON.parse(event.data);
            if (data.success) {
              setTokenCount(data.tokens);

              const currentUserDataString = await AsyncStorage.getItem(
                'userData',
              );
              const currentUserData = JSON.parse(currentUserDataString);
              await AsyncStorage.setItem(
                'userData',
                JSON.stringify({
                  ...currentUserData,
                  tokens: data.tokens,
                }),
              );
            }
          } catch (e) {
            // Silently handle JSON parsing errors
          }
        };

        eventSource.onerror = () => {
          eventSource.close();
          setTimeout(connectToTokenUpdates, 5000);
        };
      } catch (error) {
        const storedUserDataString = await AsyncStorage.getItem('userData');
        if (storedUserDataString) {
          const storedUserData = JSON.parse(storedUserDataString);
          if (storedUserData && storedUserData.tokens) {
            setTokenCount(storedUserData.tokens);
          }
        }
      }
    };

    connectToTokenUpdates();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const parseTime = timeStr => {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return { hours, minutes };
  };

  const calculateCountdown = session => {
    const now = new Date();
    const { hours: endHours, minutes: endMinutes } = parseTime(session.end);
    const endTime = new Date(now);
    endTime.setHours(endHours, endMinutes, 0, 0);

    if (endTime <= now) {
      endTime.setDate(endTime.getDate() + 1);
    }

    const difference = endTime.getTime() - now.getTime();
    const remainingSeconds = Math.floor(difference / 1000);

    return {
      hours: Math.floor(remainingSeconds / 3600),
      minutes: Math.floor((remainingSeconds % 3600) / 60),
      seconds: remainingSeconds % 60,
    };
  };

  const getValidationRules = mode => {
    switch (mode) {
      case '3-fruits-start':
      case '3-fruits-end':
        return {
          minSelections: 3,
          maxSelections: 3,
          orderType: 'ascending',
        };
      case '1-fruits-start':
      case '1-fruits-end':
        return {
          minSelections: 1,
          maxSelections: 1,
        };
      case '2-fruits':
        return {
          minSelections: 2,
          maxSelections: 2,
          orderType: 'any',
        };
      default:
        return {};
    }
  };

  const showPopup = (message, type = 'info') => {
    setModalMessage(message);
    setModalType(type);
    setShowModal(true);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowModal(false);
      });
    }, 1000);
  };

  const scrollToSelectedPictures = () => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 800);
    }
  };

  const scrollToTop = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
    }
  };

  const isSessionSelectable = session => {
    const now = currentTime;
    const { hours: startHours, minutes: startMinutes } = parseTime(
      session.start,
    );
    const { hours: endHours, minutes: endMinutes } = parseTime(session.end);

    const sessionStart = new Date(now);
    sessionStart.setHours(startHours, startMinutes, 0, 0);

    const sessionEnd = new Date(now);
    sessionEnd.setHours(endHours, endMinutes, 0, 0);

    if (endHours < startHours) {
      sessionEnd.setDate(sessionEnd.getDate() + 1);
    }

    return now <= sessionEnd;
  };

  const handleSessionSelect = sessionIndex => {
    const session = sessionTimings[sessionIndex];
    if (isSessionSelectable(session)) {
      // Animate session selection
      Animated.spring(sessionAnimations[sessionIndex], {
        toValue: 1.1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }).start(() => {
        Animated.spring(sessionAnimations[sessionIndex], {
          toValue: 1,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }).start();
      });

      setSelectedSession(sessionIndex);
      setChoiceMode('');
      setSelectedImages([]);
      setBetAmount('');
    } else {
      showPopup('This session has ended!', 'warning');
    }
  };

  const isChoiceModeDisabledDuringBreak = mode => {
    if (!selectedSession && selectedSession !== 0) return false;

    const session = sessionTimings[selectedSession];
    const breakPoints = session.breaks || [];
    const currentTime = new Date();

    return breakPoints.some(bp => {
      const breakTime = parseTime(bp.time);
      const breakDateTime = new Date();
      breakDateTime.setHours(breakTime.hours, breakTime.minutes, 0, 0);

      return (
        (mode === '3-fruits-start' ||
          mode === '1-fruits-start' ||
          mode === '2-fruits') &&
        currentTime >= breakDateTime &&
        bp.disabledModes.includes(mode)
      );
    });
  };

  const handleChoiceMode = mode => {
    if (selectedSession === null) {
      showPopup('Select a session first!', 'warning');
      return;
    }

    const session = sessionTimings[selectedSession];
    const currentTime = new Date();
    const breakPoints = session.breaks || [];

    const activeBreakPoint = breakPoints.find(bp => {
      const breakTime = parseTime(bp.time);
      const breakDateTime = new Date();
      breakDateTime.setHours(breakTime.hours, breakTime.minutes, 0, 0);
      return currentTime >= breakDateTime;
    });

    if (activeBreakPoint && activeBreakPoint.disabledModes.includes(mode)) {
      const modeLabel = choiceModes.find(m => m.key === mode)?.label || mode;
      showPopup(`${modeLabel} is not available during break time!`, 'warning');
      return;
    }

    // Animate choice mode selection
    const modeIndex = choiceModes.findIndex(m => m.key === mode);
    if (modeIndex !== -1) {
      Animated.spring(choiceModeAnimations[modeIndex], {
        toValue: 1.1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }).start(() => {
        Animated.spring(choiceModeAnimations[modeIndex], {
          toValue: 1,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }).start();
      });
    }

    setChoiceMode(mode);
    setSelectedImages([]);
    const modeLabel = choiceModes.find(m => m.key === mode)?.label || mode;
    showPopup(`${modeLabel} mode selected`, 'info');
  };

  const handleImageSelect = imagePath => {
    if (!choiceMode) {
      showPopup('Select a game mode first!', 'warning');
      return;
    }

    const validationRules = getValidationRules(choiceMode);
    const { minSelections, maxSelections, orderType } = validationRules;

    if (selectedImages.length >= maxSelections) {
      const modeLabel =
        choiceModes.find(m => m.key === choiceMode)?.label || choiceMode;
      showPopup(
        `Maximum ${maxSelections} images for ${modeLabel} mode`,
        'warning',
      );
      return;
    }

    const normalizedNumber =
      imageToNumber[imagePath] === 0 ? 10 : imageToNumber[imagePath];
    const selectedNumbers = selectedImages.map(item =>
      imageToNumber[item.image] === 0 ? 10 : imageToNumber[item.image],
    );

    if (
      orderType === 'ascending' &&
      selectedNumbers.length > 0 &&
      normalizedNumber < Math.max(...selectedNumbers)
    ) {
      showPopup('Numbers must be selected in ascending order!', 'warning');
      return;
    }

    // Animate image selection
    const imageIndex = images.findIndex(img => img === imagePath);
    if (imageIndex !== -1) {
      Animated.sequence([
        Animated.timing(imageAnimations[imageIndex], {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(imageAnimations[imageIndex], {
          toValue: 1,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    }

    // Create unique entry with timestamp-based ID
    const newSelectedImage = {
      id: Date.now() + Math.random(), // Unique identifier
      image: imagePath,
    };

    const newSelectedImages = [...selectedImages, newSelectedImage];
    setSelectedImages(newSelectedImages);

    const selectedNumber = imageToNumber[imagePath];
    showPopup(`Picture ${selectedNumber} selected!`, 'success');

    const isLastPicture = newSelectedImages.length === maxSelections;
    if (isLastPicture) {
      scrollToSelectedPictures();
    }
  };

  const handleRemoveSelectedImage = imageId => {
    setSelectedImages(prev => prev.filter(item => item.id !== imageId));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = new Date();
      setCurrentTime(newTime);

      const newCountdowns = sessionTimings.reduce((acc, session, index) => {
        acc[index] = calculateCountdown(session);
        return acc;
      }, {});

      setSessionCountdowns(newCountdowns);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleBet = async () => {
    try {
      setLoading(true);

      if (!selectedSession && selectedSession !== 0) {
        showPopup('Select a session first!', 'warning');
        setLoading(false);
        return;
      }

      if (!choiceMode) {
        showPopup('Select a game mode first!', 'warning');
        setLoading(false);
        return;
      }

      if (!betAmount) {
        showPopup('Enter bet amount!', 'warning');
        setLoading(false);
        return;
      }

      const betAmountNum = Number(betAmount);

      if (betAmountNum > tokenCount) {
        showPopup('Insufficient balance!', 'error');
        setLoading(false);
        return;
      }

      if (choiceMode === '3-fruits-start' && selectedImages.length !== 3) {
        showPopup('3 Fruits Start requires exactly 3 numbers!', 'warning');
        setLoading(false);
        return;
      }

      if (choiceMode === '3-fruits-end' && selectedImages.length !== 3) {
        showPopup('3 Fruits End requires exactly 3 numbers!', 'warning');
        setLoading(false);
        return;
      }

      if (choiceMode === '2-fruits' && selectedImages.length !== 2) {
        showPopup('2 Fruits requires exactly 2 numbers!', 'warning');
        setLoading(false);
        return;
      }

      if (
        (choiceMode === '1-fruits-start' || choiceMode === '1-fruits-end') &&
        selectedImages.length !== 1
      ) {
        showPopup(
          `${
            choiceMode === '1-fruits-start' ? '1 Fruits Start' : '1 Fruits End'
          } requires exactly 1 number!`,
          'warning',
        );
        setLoading(false);
        return;
      }

      if (selectedImages.length === 0) {
        showPopup('Select images first!', 'warning');
        setLoading(false);
        return;
      }

      const userDataString = await AsyncStorage.getItem('userData');
      const userData = JSON.parse(userDataString);

      if (
        !userData.userids ||
        !userData.userids.myuserid ||
        !userData.userids.myrefrelid
      ) {
        showPopup(
          'User ID information is missing! Please login again.',
          'error',
        );
        setLoading(false);
        return;
      }

      const userPhoneNo = userData.phoneNo;
      const userId = userData.userids.myuserid;
      const refRelId = userData.userids.myrefrelid;

      if (!userId || !refRelId) {
        showPopup(
          'User ID or Referral ID not found! Please login again.',
          'error',
        );
        setLoading(false);
        return;
      }

      // Update played amount
      try {
        const updatePlayedAmountResponse = await fetch(
          `${API_BASE_URL}/updatePlayedAmount`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: userId,
              amount: betAmountNum,
            }),
          },
        );

        if (!updatePlayedAmountResponse.ok) {
          throw new Error(
            `Failed to update played amount: ${updatePlayedAmountResponse.statusText}`,
          );
        }
      } catch (error) {
        console.error('Error updating played amount:', error);
      }

      // Token deduction
      const deductResponse = await fetch(`${API_BASE_URL}/deduct-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          phoneNo: userPhoneNo,
          amount: betAmountNum,
          userId: userId,
          refRelId: refRelId,
        }),
      });

      if (!deductResponse.ok) {
        throw new Error(`HTTP error! status: ${deductResponse.status}`);
      }

      const deductResult = await deductResponse.json();

      if (!deductResult.success) {
        showPopup(
          deductResult.message || 'Failed to place bet. Please try again.',
          'error',
        );
        setLoading(false);
        return;
      }

      const selectedNumbers = selectedImages.map(
        item => imageToNumber[item.image],
      );

      // Store game action
      const gameActionResponse = await fetch(
        `${API_BASE_URL}/store-game-action`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            phoneNo: userPhoneNo,
            sessionNumber: selectedSession + 1,
            gameMode: choiceMode,
            betAmount: betAmountNum,
            selectedNumbers: selectedNumbers,
            userId: userId,
            refRelId: refRelId,
          }),
        },
      );

      if (!gameActionResponse.ok) {
        throw new Error(`HTTP error! status: ${gameActionResponse.status}`);
      }

      const gameActionResult = await gameActionResponse.json();

      if (!gameActionResult.success) {
        showPopup(
          gameActionResult.message ||
            'Failed to store game action. Please try again.',
          'error',
        );
        setLoading(false);
        return;
      }

      // Store bet numbers
      const storeBetResponse = await fetch(
        `${API_BASE_URL}/store-bet-numbers`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            sessionNumber: selectedSession + 1,
            choiceMode: choiceMode,
            selectedNumbers: selectedNumbers,
            betAmount: betAmountNum,
            userId: userId,
          }),
        },
      );

      if (!storeBetResponse.ok) {
        throw new Error(`HTTP error! status: ${storeBetResponse.status}`);
      }

      const storeBetResult = await storeBetResponse.json();

      if (!storeBetResult.success) {
        console.error('Failed to store bet numbers:', storeBetResult.message);
      }

      showPopup('Bet Placed Successfully!', 'success');

      // Reset form fields
      setSelectedImages([]);
      setChoiceMode('');
      setBetAmount('');
      setSelectedSession(null);

      // Update token count
      setTokenCount(deductResult.currentBalance);

      // Update stored user data
      userData.tokens = deductResult.currentBalance;
      userData.userids = {
        myuserid: userId,
        myrefrelid: refRelId,
      };
      await AsyncStorage.setItem('userData', JSON.stringify(userData));

      setTimeout(() => {
        scrollToTop();
      }, 2500);
    } catch (error) {
      console.error('Error placing bet:', error);
      showPopup('Failed to place bet. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderImageGrid = () => {
    return (
      <View style={styles.imageGrid}>
        {images.map((img, index) => (
          <Animated.View
            key={index}
            style={{
              transform: [
                { scale: imageAnimations[index] },
                {
                  rotateY: imageAnimations[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: ['90deg', '0deg'],
                  }),
                },
              ],
              opacity: imageAnimations[index],
            }}
          >
            <TouchableOpacity
              onPress={() => handleImageSelect(img)}
              style={[
                styles.imageButton,
                selectedImages.some(item => item.image === img) &&
                  styles.selectedImageButton,
              ]}
            >
              <Image
                source={img}
                style={styles.imageStyle}
                resizeMode="contain"
              />
              {selectedImages.some(item => item.image === img) && (
                <Animated.View style={styles.selectedImageOverlay}>
                  <Icon name="check-circle" size={30} color="#4ade80" />
                </Animated.View>
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    );
  };

  const renderSelectedImages = () => {
    if (selectedImages.length === 0) return null;

    // Determine how many slots to show based on game mode
    let numberOfSlots;
    if (choiceMode === '1-fruits-start' || choiceMode === '1-fruits-end') {
      numberOfSlots = 1; // Only show 1 slot for 1-fruit modes
    } else if (choiceMode === '2-fruits') {
      numberOfSlots = 2; // Only show 2 slots for 2-fruits mode
    } else {
      numberOfSlots = 3; // Show 3 slots for 3-fruits modes
    }

    const displayItems = [];
    for (let i = 0; i < numberOfSlots; i++) {
      if (i < selectedImages.length) {
        displayItems.push(selectedImages[i]);
      } else {
        displayItems.push(null);
      }
    }

    return (
      <Animated.View
        style={[
          styles.selectedImagesContainer,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Text style={styles.selectedImagesTitle}>Selected Pictures</Text>
        <View
          style={[
            styles.fixedSelectedImagesRow,
            { justifyContent: numberOfSlots === 1 ? 'center' : 'space-around' },
          ]}
        >
          {displayItems.map((item, index) => (
            <View key={index} style={styles.selectedImageSlot}>
              {item ? (
                <Animated.View
                  style={[
                    styles.selectedImageItem,
                    {
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                >
                  <View style={styles.selectedImageWrapper}>
                    <Image
                      source={item.image}
                      style={styles.selectedImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() => handleRemoveSelectedImage(item.id)}
                      style={styles.removeIconButton}
                    >
                      <Icon name="close" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              ) : (
                <View style={styles.emptyImageSlot}>
                  <Text style={styles.emptySlotText}>Empty</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </Animated.View>
    );
  };

  const formatTime = date => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated Header */}
        <Animated.View
          style={[
            styles.header,
            {
              transform: [{ translateY: headerSlideAnim }],
            },
          ]}
        >
          {/* Top Navigation Bar */}
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Home')}
              style={styles.headerButton}
            >
              <Icon name="arrow-back" size={20} color="white" />
              <Text style={styles.headerButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('Results')}
            >
              <MaterialCommunityIcons name="poll" size={20} color="white" />
              <Text style={styles.headerButtonText}>Results</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() =>
                Linking.openURL('https://www.naphex.com/howtoplay')
              }
            >
              <Icon name="help" size={20} color="white" />
              <Text style={styles.headerButtonText}>How to Play</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.titleDivider} />

          {/* Animated Game Title with Glow Effect */}
          <TouchableOpacity onPress={animateTitleBounce}>
            <Animated.View
              style={[
                styles.gameTitleContainer,
                {
                  transform: [{ scale: titleBounceAnim }],
                  shadowColor: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#ef4444', '#fbbf24'],
                  }),
                  shadowOpacity: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                  shadowRadius: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 25],
                  }),
                  elevation: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [5, 15],
                  }),
                },
              ]}
            >
              <Animated.Text
                style={[
                  styles.gameTitle,
                  {
                    color: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['#ffffff', '#fef3c7'],
                    }),
                    textShadowColor: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['transparent', '#fbbf24'],
                    }),
                    textShadowRadius: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 10],
                    }),
                  },
                ]}
              >
                FRUITS GAME
              </Animated.Text>
            </Animated.View>
          </TouchableOpacity>

          {/* Header Info Section */}
          <View style={styles.headerInfo}>
            <View style={styles.headerInfoColumn}>
              <View style={styles.headerInfoItem}>
                <Icon name="access-time" size={16} color="#fff" />
                <Text style={styles.infoLabel}>Time</Text>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              </View>
            </View>
            <View style={styles.headerInfoColumn}>
              <View style={styles.headerInfoItem}>
                <MaterialCommunityIcons name="bitcoin" size={16} color="#fff" />
                <Text style={styles.infoLabel}>Tokens</Text>
                <Animated.Text
                  style={[
                    styles.tokenText,
                    {
                      transform: [{ scale: tokenCountAnim }],
                    },
                  ]}
                >
                  {tokenCount.toFixed(2)}
                </Animated.Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Animated Sessions */}
        <View style={styles.sessionsContainer}>
          {sessionTimings.map((session, index) => (
            <Animated.View
              key={index}
              style={{
                transform: [
                  { scale: sessionAnimations[index] },
                  {
                    translateY: sessionAnimations[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [index % 2 === 0 ? -200 : 200, 0],
                    }),
                  },
                ],
                opacity: sessionAnimations[index],
              }}
            >
              <TouchableOpacity
                onPress={() => handleSessionSelect(index)}
                style={[
                  styles.sessionCard,
                  selectedSession === index && styles.selectedSessionCard,
                  !isSessionSelectable(session) && styles.disabledSessionCard,
                ]}
              >
                <Text
                  style={[
                    styles.sessionLabel,
                    selectedSession === index && styles.selectedSessionText,
                  ]}
                >
                  {session.label}
                </Text>
                <Text
                  style={[
                    styles.sessionTime,
                    selectedSession === index && styles.selectedSessionText,
                  ]}
                >
                  {session.start} - {session.end}
                </Text>
                {sessionCountdowns[index] && (
                  <Text
                    style={[
                      styles.countdownText,
                      selectedSession === index && styles.selectedCountdownText,
                    ]}
                  >
                    Remaining time:{' '}
                    {String(sessionCountdowns[index].hours).padStart(2, '0')}:
                    {String(sessionCountdowns[index].minutes).padStart(2, '0')}:
                    {String(sessionCountdowns[index].seconds).padStart(2, '0')}
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Animated Choice Mode Buttons */}
        <View style={styles.choiceModeContainer}>
          {choiceModes.map((mode, index) => {
            const isDisabledDuringBreak = isChoiceModeDisabledDuringBreak(
              mode.key,
            );
            const isSelected = choiceMode === mode.key;
            return (
              <Animated.View
                key={mode.key}
                style={{
                  transform: [
                    { scale: choiceModeAnimations[index] },
                    {
                      translateY: choiceModeAnimations[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    },
                  ],
                  opacity: choiceModeAnimations[index],
                }}
              >
                <TouchableOpacity
                  onPress={() => handleChoiceMode(mode.key)}
                  disabled={isDisabledDuringBreak}
                  style={[
                    styles.choiceModeButton,
                    isSelected && styles.selectedChoiceModeButton,
                    isDisabledDuringBreak && styles.disabledChoiceModeButton,
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceModeButtonText,
                      isSelected && styles.selectedChoiceModeButtonText,
                    ]}
                  >
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Animated Image Grid */}
        {renderImageGrid()}

        {/* Animated Selected Images */}
        {renderSelectedImages()}

        {/* Animated Bet Section */}
        <Animated.View
          style={[
            styles.betSectionContainer,
            {
              transform: [
                { scale: betSectionAnim },
                {
                  translateY: betSectionAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                },
              ],
              opacity: betSectionAnim,
            },
          ]}
        >
          <View style={styles.betInputContainer}>
            <TextInput
              style={styles.betInput}
              placeholder="Enter Bet Amount"
              placeholderTextColor="#999"
              value={betAmount}
              onChangeText={text => {
                const value = text.replace(/\D/g, '');
                setBetAmount(value);
              }}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.placeBetButtonContainer}>
            <TouchableOpacity
              onPress={handleBet}
              disabled={loading}
              style={[
                styles.placeBetButton,
                loading && styles.disabledPlaceBetButton,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.placeBetButtonText}>Place Bet</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Enhanced Modal with Animations */}
      <Modal transparent={true} visible={showModal} animationType="none">
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: scaleAnim },
                  {
                    rotateX: scaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['90deg', '0deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.modalIconContainer}>
              {modalType === 'success' && (
                <Icon name="check-circle" size={50} color="#10b981" />
              )}
              {modalType === 'error' && (
                <Icon name="error" size={50} color="#ef4444" />
              )}
              {modalType === 'warning' && (
                <Icon name="warning" size={50} color="#f59e0b" />
              )}
              {modalType === 'info' && (
                <Icon name="info" size={50} color="#3b82f6" />
              )}
            </View>
            <Text
              style={[
                styles.modalText,
                modalType === 'error' && styles.modalErrorText,
                modalType === 'success' && styles.modalSuccessText,
                modalType === 'warning' && styles.modalWarningText,
              ]}
            >
              {modalMessage}
            </Text>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

export default OpenCloseGame;
