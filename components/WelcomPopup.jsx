import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  StyleSheet,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const WelcomePopup = ({ isVisible, onClose }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const sparkleAnims = useRef([...Array(20)].map(() => new Animated.Value(0))).current;
  const diamondAnims = useRef([...Array(8)].map(() => new Animated.Value(0))).current;
  const triangleAnims = useRef([...Array(6)].map(() => new Animated.Value(0))).current;
  const hexagonAnims = useRef([...Array(5)].map(() => new Animated.Value(0))).current;
  const bounceAnims = useRef([...Array(4)].map(() => new Animated.Value(0))).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isVisible) {
      // Main popup animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();

      // Start background animations
      startBackgroundAnimations();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [isVisible]);

  const startBackgroundAnimations = () => {
    // Sparkle animations
    sparkleAnims.forEach((anim, index) => {
      const animate = () => {
        anim.setValue(0);
        Animated.timing(anim, {
          toValue: 1,
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: true,
        }).start(animate);
      };
      setTimeout(animate, Math.random() * 3000);
    });

    // Diamond animations
    diamondAnims.forEach((anim, index) => {
      const animate = () => {
        anim.setValue(0);
        Animated.timing(anim, {
          toValue: 1,
          duration: 4000 + Math.random() * 2000,
          useNativeDriver: true,
        }).start(animate);
      };
      setTimeout(animate, Math.random() * 4000);
    });

    // Triangle animations
    triangleAnims.forEach((anim, index) => {
      const animate = () => {
        anim.setValue(0);
        Animated.timing(anim, {
          toValue: 1,
          duration: 5000 + Math.random() * 2000,
          useNativeDriver: true,
        }).start(animate);
      };
      setTimeout(animate, Math.random() * 5000);
    });

    // Hexagon animations
    hexagonAnims.forEach((anim, index) => {
      const animate = () => {
        anim.setValue(0);
        Animated.timing(anim, {
          toValue: 1,
          duration: 6000 + Math.random() * 2000,
          useNativeDriver: true,
        }).start(animate);
      };
      setTimeout(animate, Math.random() * 6000);
    });

    // Bounce animations for decorative elements
    bounceAnims.forEach((anim, index) => {
      const animate = () => {
        Animated.sequence([
          Animated.timing(anim, {
            toValue: -10,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: -5,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setTimeout(animate, 1400);
        });
      };
      setTimeout(animate, index * 500);
    });

    // Pulse animation for logo
    const pulsate = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(pulsate);
    };
    pulsate();
  };

  const generateSparkles = () => {
    return sparkleAnims.map((anim, index) => (
      <Animated.View
        key={`sparkle-${index}`}
        style={[
          styles.sparkle,
          {
            left: Math.random() * (screenWidth * 0.9),
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [screenHeight, -100],
                }),
              },
              {
                scale: anim.interpolate({
                  inputRange: [0, 0.1, 0.9, 1],
                  outputRange: [0, 1, 1, 0],
                }),
              },
            ],
            opacity: anim.interpolate({
              inputRange: [0, 0.1, 0.9, 1],
              outputRange: [0, 1, 1, 0],
            }),
          },
        ]}
      />
    ));
  };

  const generateDiamonds = () => {
    return diamondAnims.map((anim, index) => (
      <Animated.View
        key={`diamond-${index}`}
        style={[
          styles.diamond,
          {
            left: Math.random() * (screenWidth * 0.9),
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [screenHeight, -100],
                }),
              },
              {
                rotate: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['45deg', '405deg'],
                }),
              },
            ],
            opacity: anim.interpolate({
              inputRange: [0, 0.1, 0.9, 1],
              outputRange: [0, 0.8, 0.8, 0],
            }),
          },
        ]}
      />
    ));
  };

  const generateTriangles = () => {
    return triangleAnims.map((anim, index) => (
      <Animated.View
        key={`triangle-${index}`}
        style={[
          styles.triangle,
          {
            left: Math.random() * (screenWidth * 0.9),
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [screenHeight, -100],
                }),
              },
              {
                translateX: anim.interpolate({
                  inputRange: [0, 0.25, 0.5, 0.75, 1],
                  outputRange: [0, 30, -20, 40, 0],
                }),
              },
            ],
            opacity: anim.interpolate({
              inputRange: [0, 0.1, 0.9, 1],
              outputRange: [0, 0.7, 0.7, 0],
            }),
          },
        ]}
      />
    ));
  };

  const generateHexagons = () => {
    return hexagonAnims.map((anim, index) => (
      <Animated.View
        key={`hexagon-${index}`}
        style={[
          styles.hexagon,
          {
            left: Math.random() * (screenWidth * 0.9),
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [screenHeight, -100],
                }),
              },
              {
                translateX: anim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, -50, 20],
                }),
              },
              {
                rotate: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
            opacity: anim.interpolate({
              inputRange: [0, 0.1, 0.9, 1],
              outputRange: [0, 0.6, 0.6, 0],
            }),
          },
        ]}
      />
    ));
  };

  return (
    <Modal visible={isVisible} transparent animationType="none">
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY: slideAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientContainer}
          >
            {/* Close Button */}
            <View style={styles.closeButtonContainer}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Animated Background Elements */}
            <View style={styles.bgAnimation}>
              {generateSparkles()}
              {generateDiamonds()}
              {generateTriangles()}
              {generateHexagons()}
            </View>

            {/* Main Content */}
            <ScrollView
              style={styles.scrollContainer}
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.mainContent}>
                {/* Header with Logo */}
                <View style={styles.header}>
                  <View style={styles.logo}>
                    <Animated.Text
                      style={[
                        styles.logoIcon,
                        {
                          transform: [{ scale: pulseAnim }],
                        },
                      ]}
                    >
                      🎮
                    </Animated.Text>
                    <LinearGradient
                      colors={['#ffd700', '#ff6b6b']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.brandGradient}
                    >
                      <Text style={styles.brand}>NAPHEX</Text>
                    </LinearGradient>
                  </View>
                  <Text style={styles.tagline}>Your Gateway to Ultimate Gaming Fun</Text>
                </View>

                {/* Main Description */}
                <View style={styles.description}>
                  <Text style={styles.intro}>
                    <Text style={styles.bold}>naphex.com</Text> is your ultimate destination for gaming and sports betting enthusiasts.
                  </Text>

                  <View style={styles.features}>
                    <View style={styles.featureItem}>
                      <Text style={styles.featureIcon}>🎲</Text>
                      <Text style={styles.featureText}>
                        Thrilling casino games like <Text style={styles.bold}>Fruits</Text>
                      </Text>
                    </View>

                    <View style={styles.featureItem}>
                      <Text style={styles.featureIcon}>🏆</Text>
                      <Text style={styles.featureText}>Sports betting and game exchange</Text>
                    </View>

                    <View style={styles.featureItem}>
                      <Text style={styles.featureIcon}>💰</Text>
                      <Text style={styles.featureText}>
                        Real cash games and <Text style={styles.bold}>Crazy Time</Text> casino betting
                      </Text>
                    </View>

                    <View style={styles.featureItem}>
                      <Text style={styles.featureIcon}>👥</Text>
                      <Text style={styles.featureText}>
                        Play matches with friends on a secure platform
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.conclusion}>
                    Whether you're a <Text style={styles.highlight}>beginner</Text> or a{' '}
                    <Text style={styles.highlight}>pro</Text>,{' '}
                    <Text style={styles.bold}>naphex.com</Text> promises unforgettable gaming experiences tailored to your interests.
                  </Text>
                </View>
              </View>

              {/* Bottom Section */}
              <View style={styles.bottomSection}>
                {/* Call to Action Button */}
                <TouchableOpacity onPress={onClose}>
                  <LinearGradient
                    colors={['#ff6b6b', '#ffd700']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.continueBtn}
                  >
                    <Text style={styles.continueBtnIcon}>▶️</Text>
                    <Text style={styles.continueBtnText}>Continue to Dashboard</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Decorative Elements */}
                <View style={styles.decorations}>
                  {['🎮', '🎲', '🏆', '💎'].map((emoji, index) => (
                    <Animated.View
                      key={index}
                      style={[
                        styles.decoCard,
                        {
                          transform: [{ translateY: bounceAnims[index] }],
                        },
                      ]}
                    >
                      <Text style={styles.decoEmoji}>{emoji}</Text>
                    </Animated.View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    width: screenWidth * 0.9,
    maxHeight: screenHeight * 0.9,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.3,
    shadowRadius: 50,
  },
  gradientContainer: {
    flex: 1,
    position: 'relative',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
  },
  closeButton: {
    width: 35,
    height: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  bgAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  sparkle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#ffd700',
    borderRadius: 2,
  },
  diamond: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: '#ff6b6b',
    transform: [{ rotate: '45deg' }],
  },
  triangle: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  hexagon: {
    position: 'absolute',
    width: 16,
    height: 16,
    backgroundColor: 'rgba(102, 126, 234, 0.6)',
  },
  scrollContainer: {
    flex: 1,
    zIndex: 2,
  },
  content: {
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 30,
    minHeight: screenHeight * 0.8,
    justifyContent: 'space-between',
  },
  mainContent: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoIcon: {
    fontSize: screenWidth < 400 ? 30 : 40,
    marginRight: 10,
  },
  brandGradient: {
    paddingHorizontal: 1,
    paddingVertical: 1,
  },
  brand: {
    fontSize: screenWidth < 400 ? 20 : 32,
    fontWeight: 'bold',
    color: 'transparent',
  },
  tagline: {
    fontSize: screenWidth < 400 ? 14 : 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  description: {
    alignItems: 'center',
  },
  intro: {
    fontSize: screenWidth < 400 ? 14 : 16,
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  bold: {
    fontWeight: 'bold',
  },
  features: {
    marginVertical: 20,
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 30,
  },
  featureText: {
    flex: 1,
    fontSize: screenWidth < 400 ? 13 : 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.95)',
  },
  conclusion: {
    fontSize: screenWidth < 400 ? 14 : 15,
    lineHeight: 24,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  highlight: {
    color: '#ffd700',
    fontWeight: '600',
  },
  bottomSection: {
    alignItems: 'center',
    paddingTop: 20,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: screenWidth < 400 ? 24 : 32,
    paddingVertical: screenWidth < 400 ? 12 : 16,
    borderRadius: 50,
    marginBottom: 20,
    elevation: 10,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
  },
  continueBtnIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  continueBtnText: {
    color: 'white',
    fontSize: screenWidth < 400 ? 15 : 17,
    fontWeight: '600',
  },
  decorations: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  decoCard: {
    width: screenWidth < 400 ? 35 : 40,
    height: screenWidth < 400 ? 35 : 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decoEmoji: {
    fontSize: screenWidth < 400 ? 16 : 20,
  },
});

export default WelcomePopup;