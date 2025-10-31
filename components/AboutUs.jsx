import React from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
  StatusBar,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Custom gradient component using multiple overlapping views
const CustomGradient = ({ colors, style, children, direction = 'vertical' }) => {
  const gradientStyle = {
    ...style,
    backgroundColor: colors[0],
    position: 'relative',
    overflow: 'hidden',
  };

  return (
    <View style={gradientStyle}>
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: colors[1],
          opacity: 0.7,
        }}
      />
      {colors[2] && (
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: colors[2],
            opacity: 0.3,
          }}
        />
      )}
      <View style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </View>
    </View>
  );
};

// Custom Icons
const CustomIcon = ({ name, size = 24, color = 'white' }) => {
  const iconStyle = {
    width: size,
    height: size,
    justifyContent: 'center',
    alignItems: 'center',
  };

  const renderIcon = () => {
    switch (name) {
      case 'users':
        return (
          <View style={iconStyle}>
            <View style={{
              width: size * 0.4,
              height: size * 0.4,
              borderRadius: size * 0.2,
              borderWidth: 2,
              borderColor: color,
              marginBottom: 2,
            }} />
            <View style={{
              width: size * 0.8,
              height: size * 0.3,
              borderTopLeftRadius: size * 0.4,
              borderTopRightRadius: size * 0.4,
              borderWidth: 2,
              borderColor: color,
              borderBottomWidth: 0,
            }} />
          </View>
        );
      case 'shield':
        return (
          <View style={iconStyle}>
            <View style={{
              width: size * 0.7,
              height: size * 0.8,
              borderWidth: 2,
              borderColor: color,
              borderTopLeftRadius: size * 0.35,
              borderTopRightRadius: size * 0.35,
              borderBottomLeftRadius: size * 0.1,
              borderBottomRightRadius: size * 0.1,
              position: 'relative',
            }}>
              <View style={{
                position: 'absolute',
                top: size * 0.15,
                left: size * 0.15,
                width: size * 0.15,
                height: size * 0.25,
                backgroundColor: color,
              }} />
            </View>
          </View>
        );
      case 'award':
        return (
          <View style={iconStyle}>
            <View style={{
              width: size * 0.6,
              height: size * 0.6,
              borderRadius: size * 0.3,
              borderWidth: 2,
              borderColor: color,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <View style={{
                width: size * 0.2,
                height: size * 0.2,
                backgroundColor: color,
              }} />
            </View>
            <View style={{
              position: 'absolute',
              bottom: 0,
              left: size * 0.35,
              width: size * 0.3,
              height: size * 0.25,
              backgroundColor: color,
            }} />
          </View>
        );
      case 'check-circle':
        return (
          <View style={iconStyle}>
            <View style={{
              width: size * 0.9,
              height: size * 0.9,
              borderRadius: size * 0.45,
              borderWidth: 2,
              borderColor: color,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <View style={{
                width: size * 0.3,
                height: size * 0.15,
                borderBottomWidth: 2,
                borderRightWidth: 2,
                borderColor: color,
                transform: [{ rotate: '45deg' }],
                marginTop: -size * 0.05,
              }} />
            </View>
          </View>
        );
      case 'star':
        return (
          <View style={iconStyle}>
            <View style={{
              width: 0,
              height: 0,
              borderLeftWidth: size * 0.15,
              borderRightWidth: size * 0.15,
              borderBottomWidth: size * 0.25,
              borderStyle: 'solid',
              backgroundColor: 'transparent',
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: color,
            }} />
            <View style={{
              position: 'absolute',
              top: size * 0.15,
              width: 0,
              height: 0,
              borderLeftWidth: size * 0.15,
              borderRightWidth: size * 0.15,
              borderTopWidth: size * 0.25,
              borderStyle: 'solid',
              backgroundColor: 'transparent',
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: color,
            }} />
          </View>
        );
      case 'mail':
        return (
          <View style={iconStyle}>
            <View style={{
              width: size * 0.8,
              height: size * 0.6,
              borderWidth: 2,
              borderColor: color,
              borderRadius: 4,
            }} />
            <View style={{
              position: 'absolute',
              top: size * 0.2,
              left: size * 0.1,
              width: size * 0.4,
              height: size * 0.3,
              borderRightWidth: 2,
              borderBottomWidth: 2,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
            }} />
            <View style={{
              position: 'absolute',
              top: size * 0.2,
              right: size * 0.1,
              width: size * 0.4,
              height: size * 0.3,
              borderLeftWidth: 2,
              borderBottomWidth: 2,
              borderColor: color,
              transform: [{ rotate: '-45deg' }],
            }} />
          </View>
        );
      case 'lock':
        return (
          <View style={iconStyle}>
            <View style={{
              width: size * 0.5,
              height: size * 0.4,
              borderTopLeftRadius: size * 0.25,
              borderTopRightRadius: size * 0.25,
              borderWidth: 2,
              borderColor: color,
              borderBottomWidth: 0,
              marginBottom: 2,
            }} />
            <View style={{
              width: size * 0.7,
              height: size * 0.4,
              backgroundColor: color,
              borderRadius: 4,
            }} />
          </View>
        );
      case 'file-text':
        return (
          <View style={iconStyle}>
            <View style={{
              width: size * 0.7,
              height: size * 0.85,
              borderWidth: 2,
              borderColor: color,
              borderRadius: 3,
              position: 'relative',
            }}>
              <View style={{
                position: 'absolute',
                top: size * 0.15,
                left: size * 0.1,
                right: size * 0.1,
                height: 2,
                backgroundColor: color,
              }} />
              <View style={{
                position: 'absolute',
                top: size * 0.25,
                left: size * 0.1,
                right: size * 0.2,
                height: 2,
                backgroundColor: color,
              }} />
              <View style={{
                position: 'absolute',
                top: size * 0.35,
                left: size * 0.1,
                right: size * 0.15,
                height: 2,
                backgroundColor: color,
              }} />
            </View>
          </View>
        );
      case 'help-circle':
        return (
          <View style={iconStyle}>
            <View style={{
              width: size * 0.9,
              height: size * 0.9,
              borderRadius: size * 0.45,
              borderWidth: 2,
              borderColor: color,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={{
                fontSize: size * 0.5,
                fontWeight: 'bold',
                color: color,
              }}>?</Text>
            </View>
          </View>
        );
      case 'building':
        return (
          <View style={iconStyle}>
            <View style={{
              width: size * 0.8,
              height: size * 0.6,
              borderWidth: 2,
              borderColor: color,
              borderRadius: 2,
            }} />
            <View style={{
              position: 'absolute',
              top: size * 0.15,
              left: size * 0.2,
              width: size * 0.1,
              height: size * 0.1,
              backgroundColor: color,
            }} />
            <View style={{
              position: 'absolute',
              top: size * 0.15,
              right: size * 0.2,
              width: size * 0.1,
              height: size * 0.1,
              backgroundColor: color,
            }} />
            <View style={{
              position: 'absolute',
              bottom: size * 0.15,
              left: size * 0.2,
              width: size * 0.1,
              height: size * 0.1,
              backgroundColor: color,
            }} />
            <View style={{
              position: 'absolute',
              bottom: size * 0.15,
              right: size * 0.2,
              width: size * 0.1,
              height: size * 0.1,
              backgroundColor: color,
            }} />
          </View>
        );
      case 'map-pin':
        return (
          <View style={iconStyle}>
            <View style={{
              width: size * 0.6,
              height: size * 0.6,
              borderRadius: size * 0.3,
              borderWidth: 2,
              borderColor: color,
            }} />
            <View style={{
              position: 'absolute',
              bottom: -size * 0.1,
              left: size * 0.2,
              width: size * 0.2,
              height: size * 0.3,
              backgroundColor: color,
              borderBottomLeftRadius: size * 0.1,
              borderBottomRightRadius: size * 0.1,
            }} />
          </View>
        );
      case 'phone':
        return (
          <View style={iconStyle}>
            <View style={{
              width: size * 0.6,
              height: size * 0.8,
              borderWidth: 2,
              borderColor: color,
              borderRadius: size * 0.1,
              position: 'relative',
            }}>
              <View style={{
                position: 'absolute',
                top: size * 0.1,
                left: size * 0.2,
                right: size * 0.2,
                height: 2,
                backgroundColor: color,
              }} />
              <View style={{
                position: 'absolute',
                top: size * 0.2,
                left: size * 0.25,
                right: size * 0.25,
                height: size * 0.3,
                borderWidth: 2,
                borderColor: color,
                borderRadius: 2,
              }} />
              <View style={{
                position: 'absolute',
                bottom: size * 0.1,
                left: size * 0.25,
                right: size * 0.25,
                height: size * 0.1,
                borderRadius: size * 0.05,
                backgroundColor: color,
              }} />
            </View>
          </View>
        );
      default:
        return (
          <View style={{
            ...iconStyle,
            backgroundColor: color,
            borderRadius: size / 2,
          }} />
        );
    }
  };

  return renderIcon();
};

const AboutPage = ({ navigation }) => {
  const handleEmailPress = () => {
    Linking.openURL('mailto:naphex24@outlook.com');
  };

  const handlePhonePress = () => {
    Linking.openURL('tel:+917892739656');
  };

  const handleLinkPress = (route) => {
    navigation.navigate(route);
  };

  const footerLinks = [
    {
      title: 'Terms & Conditions',
      route: 'TermsAndConditions',
      icon: 'file-text',
      description: 'Review our terms'
    },
    {
      title: 'KYC Policy',
      route: 'KycPolicy',
      icon: 'shield',
      description: 'Know your customer'
    },
    {
      title: 'Privacy Policy',
      route: 'PrivacyPolicy',
      icon: 'lock',
      description: 'Your privacy matters'
    },
    {
      title: 'Game Rules',
      route: 'GameRules',
      icon: 'award',
      description: 'Gaming guidelines'
    },
    {
      title: 'FAQs',
      route: 'Faqs',
      icon: 'help-circle',
      description: 'Get answers'
    }
  ];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0f172a" barStyle="light-content" />
      
      {/* GSTN Number Bar */}
      <CustomGradient
        colors={['rgba(30, 58, 138, 0.8)', 'rgba(6, 182, 212, 0.8)']}
        style={styles.gstnBar}
      >
        <View style={styles.gstnContent}>
          <CustomIcon name="building" size={18} color="#22d3ee" />
          <Text style={styles.gstnText}>GSTN: 29AAWFN6270D1ZR</Text>
        </View>
      </CustomGradient>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <CustomGradient
          colors={['#0f172a', '#1e3a8a', '#0f172a']}
          style={styles.heroSection}
        >
          <CustomGradient
            colors={['rgba(59, 130, 246, 0.2)', 'rgba(6, 182, 212, 0.2)']}
            style={styles.heroOverlay}
          >
            <View style={styles.heroContent}>
              <CustomGradient
                colors={['#3b82f6', '#06b6d4']}
                style={styles.logoContainer}
              >
                <Image 
                  source={require('../images/logo-1.png')} 
                  style={styles.logo}
                  resizeMode="cover"
                />
              </CustomGradient>
              
              <Text style={styles.companyText}>
                NADAKATTI ENTERPRISES PRESENTS
              </Text>
              
              <Text style={styles.heroTitle}>
                Naphex
              </Text>
              
              <Text style={styles.heroSubtitle}>
                A premium product of Nadakatti Enterprises - Your premier destination for world-class online gaming experiences
              </Text>
            </View>
          </CustomGradient>
        </CustomGradient>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Welcome Section */}
          <CustomGradient
            colors={['rgba(15, 23, 42, 0.7)', 'rgba(30, 58, 138, 0.5)']}
            style={styles.welcomeCard}
          >
            <View style={styles.sectionHeader}>
              <CustomGradient
                colors={['#3b82f6', '#06b6d4']}
                style={styles.iconContainer}
              >
                <CustomIcon name="users" size={24} color="white" />
              </CustomGradient>
              <Text style={styles.sectionTitle}>Welcome to Naphex</Text>
            </View>
            
            <View style={styles.textContent}>
              <Text style={styles.paragraph}>
                Welcome to Naphex, a premium online gaming platform brought to you by Nadakatti Enterprises. We offer a wide range of gaming options to users including, online slots, and sports gaming that you can enjoy using your device such as mobile and laptop.
              </Text>
              
              <Text style={styles.paragraph}>
                As a sub-product of Nadakatti Enterprises, Naphex upholds the same standards of excellence and innovation. We offer live gaming options on different sports and games . At Naphex, we provide the best gaming experience to users and the chance to test their skills and win real rewards.
              </Text>
              
              <Text style={[styles.paragraph, { marginBottom: 0 }]}>
                Backed by Nadakatti Enterprises reputation for quality and reliability, we ensure that all of your personal and financial data is safe and secured. We use industry-standard encryption and follow strict safety protocols so that users can experience worry-free gaming and focus more on their games.
              </Text>
            </View>
          </CustomGradient>

          {/* Features Section */}
          <View style={styles.featuresContainer}>
            {/* Fairness and Security */}
            <CustomGradient
              colors={['rgba(30, 58, 138, 0.4)', 'rgba(15, 23, 42, 0.4)']}
              style={styles.featureCard}
            >
              <View style={styles.sectionHeader}>
                <CustomGradient
                  colors={['#3b82f6', '#06b6d4']}
                  style={styles.iconContainer}
                >
                  <CustomIcon name="shield" size={24} color="white" />
                </CustomGradient>
                <Text style={styles.featureTitle}>Fairness & Security</Text>
              </View>
              
              <View style={styles.textContent}>
                <Text style={styles.featureParagraph}>
                  Our platform is designed to offer a fair and transparent gaming experience to users, and for this, 
                  we incorporate an advanced fairness policy for our gaming providers.
                </Text>
                
                <Text style={styles.featureParagraph}>
                  This audit helps us ensure that the outcomes generated by the games on our platform will be random 
                  and unbiased. Here, we are committed to offering you a platform on which you can trust and rely for 
                  all your gaming needs without any concern.
                </Text>
                
                <View style={styles.checkItem}>
                  <CustomIcon name="check-circle" size={20} color="#22d3ee" />
                  <Text style={styles.checkText}>Industry-Standard Encryption</Text>
                </View>
              </View>
            </CustomGradient>

            {/* Gaming Experience */}
            <CustomGradient
              colors={['rgba(6, 182, 212, 0.4)', 'rgba(30, 58, 138, 0.4)']}
              style={styles.featureCard}
            >
              <View style={styles.sectionHeader}>
                <CustomGradient
                  colors={['#06b6d4', '#3b82f6']}
                  style={styles.iconContainer}
                >
                  <CustomIcon name="award" size={24} color="white" />
                </CustomGradient>
                <Text style={styles.featureTitle}>Your Gaming Experience</Text>
              </View>
              
              <View style={styles.textContent}>
                <Text style={styles.featureParagraph}>
                  Here, you get the gaming environment where you can place your stakes with complete safety at all times 
                  and have confidence in the integrity of all the games.
                </Text>
                
                <Text style={styles.featureParagraph}>
                  With a major focus on simplicity, safety, and fairness, we offer the best possible gaming experience 
                  to our players. Based on feedback and market demand, we keep updating our services to meet the 
                  expectations of our users.
                </Text>
                
                <View style={styles.checkItem}>
                  <CustomIcon name="star" size={20} color="#60a5fa" />
                  <Text style={styles.checkText}>Continuously Updated Services</Text>
                </View>
              </View>
            </CustomGradient>
          </View>

          {/* Mission Statement */}
          <CustomGradient
            colors={['rgba(30, 58, 138, 0.6)', 'rgba(6, 182, 212, 0.6)']}
            style={styles.missionCard}
          >
            <Text style={styles.missionTitle}>Our Mission</Text>
            <Text style={styles.missionText}>
              As part of Nadakatti Enterprises, our mission is to provide the most friendly and rewarding gaming platform 
              to users while ensuring the complete safety of their data and money. We strive to create an environment 
              where gaming excellence meets absolute security, upholding the values and standards of our parent company.
            </Text>
          </CustomGradient>

          {/* Contact Us Section */}
          <CustomGradient
            colors={['rgba(15, 23, 42, 0.7)', 'rgba(30, 58, 138, 0.5)']}
            style={styles.contactCard}
          >
            <View style={styles.contactHeader}>
              <Text style={styles.contactTitle}>Contact Us</Text>
              <Text style={styles.contactSubtitle}>Get in touch with Nadakatti Enterprises</Text>
            </View>
            
            <View style={styles.contactGrid}>
              <View style={styles.contactItem}>
                <CustomGradient
                  colors={['#3b82f6', '#06b6d4']}
                  style={styles.contactIconContainer}
                >
                  <CustomIcon name="building" size={28} color="white" />
                </CustomGradient>
                <Text style={styles.contactItemTitle}>Company Name</Text>
                <Text style={styles.contactItemText}>Nadakatti Enterprises</Text>
              </View>
              
              <View style={styles.contactItem}>
                <CustomGradient
                  colors={['#3b82f6', '#06b6d4']}
                  style={styles.contactIconContainer}
                >
                  <CustomIcon name="map-pin" size={28} color="white" />
                </CustomGradient>
                <Text style={styles.contactItemTitle}>Address</Text>
                <Text style={styles.contactItemText}>
                  Narendra Cross{'\n'}
                  Dharwad{'\n'}
                  Karnataka 580005
                </Text>
              </View>
              
              <View style={styles.contactItem}>
                <CustomGradient
                  colors={['#3b82f6', '#06b6d4']}
                  style={styles.contactIconContainer}
                >
                  <CustomIcon name="phone" size={28} color="white" />
                </CustomGradient>
                <Text style={styles.contactItemTitle}>Phone</Text>
                <TouchableOpacity onPress={handlePhonePress}>
                  <Text style={[styles.contactItemText, styles.phoneLink]}>
                    +91 7892739656
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </CustomGradient>

          {/* Support Section */}
          <CustomGradient
            colors={['rgba(30, 58, 138, 0.4)', 'rgba(15, 23, 42, 0.6)']}
            style={styles.supportCard}
          >
            <View style={styles.supportContent}>
              <View style={styles.supportInfo}>
                <CustomGradient
                  colors={['#3b82f6', '#06b6d4']}
                  style={styles.mailIconContainer}
                >
                  <CustomIcon name="mail" size={32} color="white" />
                </CustomGradient>
                <View style={styles.supportText}>
                  <Text style={styles.supportTitle}>Need Support?</Text>
                  <Text style={styles.supportSubtitle}>We're here to help with any questions you might have</Text>
                </View>
              </View>
              
              <View style={styles.contactSection}>
                <Text style={styles.contactLabel}>Contact our support team:</Text>
                <TouchableOpacity 
                  onPress={handleEmailPress}
                  activeOpacity={0.8}
                >
                  <CustomGradient
                    colors={['#2563eb', '#0891b2']}
                    style={styles.emailButton}
                  >
                    <CustomIcon name="mail" size={20} color="white" />
                    <Text style={styles.emailButtonText}>naphex24@outlook.com</Text>
                  </CustomGradient>
                </TouchableOpacity>
              </View>
            </View>
          </CustomGradient>

          {/* Disclaimer */}
          <View style={styles.disclaimerCard}>
            <View style={styles.disclaimerContent}>
              <CustomIcon name="lock" size={20} color="#60a5fa" />
              <View style={[styles.disclaimerText, { marginLeft: 12 }]}>
                <Text style={styles.disclaimerTitle}>Important Notice</Text>
                <Text style={styles.disclaimerBody}>
                  The data on this page might get updated from time to time. We advise you to be vigilant and 
                  inform yourself about any changes from time to time with privacy and confidentiality policies in mind.
                </Text>
              </View>
            </View>
          </View>

          {/* Enhanced Footer */}
          <CustomGradient
            colors={['rgba(15, 23, 42, 0.8)', 'rgba(30, 58, 138, 0.6)']}
            style={styles.footer}
          >
            {/* Important Links Section */}
            <View style={styles.footerLinksSection}>
              <Text style={styles.footerLinksTitle}>Important Links</Text>
              <Text style={styles.footerLinksSubtitle}>
                Access our legal documents and support resources
              </Text>
              
              <View style={styles.footerLinksGrid}>
                {footerLinks.map((link, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleLinkPress(link.route)}
                    activeOpacity={0.8}
                    style={styles.footerLinkCard}
                  >
                    <CustomGradient
                      colors={['rgba(59, 130, 246, 0.3)', 'rgba(6, 182, 212, 0.3)']}
                      style={styles.footerLinkCardInner}
                    >
                      <View style={styles.footerLinkIcon}>
                        <CustomIcon name={link.icon} size={20} color="#60a5fa" />
                      </View>
                      <View style={styles.footerLinkContent}>
                        <Text style={styles.footerLinkTitle}>{link.title}</Text>
                        <Text style={styles.footerLinkDescription}>{link.description}</Text>
                      </View>
                    </CustomGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Divider */}
            <View style={styles.footerDivider} />

            {/* Copyright Section */}
            <View style={styles.copyrightSection}>
              <CustomGradient
                colors={['#3b82f6', '#06b6d4']}
                style={styles.copyrightLogoContainer}
              >
                <Image 
                  source={require('../images/logo-1.png')} 
                  style={styles.copyrightLogo}
                  resizeMode="cover"
                />
              </CustomGradient>
              
              <Text style={styles.copyrightText}>
                © 2025/2026 NADAKATTI ENTERPRISES
              </Text>
              <Text style={styles.copyrightSubtext}>
                All rights reserved. Naphex is a premium gaming platform.
              </Text>
            </View>
          </CustomGradient>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  // GSTN Bar Styles
  gstnBar: {
    paddingTop: 40, // Added margin from top for mobile status bar
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.3)',
  },
  gstnContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gstnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    minHeight: height * 0.4,
    position: 'relative',
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  heroContent: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  companyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22d3ee',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#60a5fa',
    marginBottom: 16,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#e2e8f0',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: width - 40,
  },
  mainContent: {
    padding: 20,
  },
  welcomeCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  textContent: {
    marginTop: 8,
  },
  paragraph: {
    fontSize: 16,
    color: '#e2e8f0',
    lineHeight: 24,
    marginBottom: 16,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  featureParagraph: {
    fontSize: 14,
    color: '#e2e8f0',
    lineHeight: 22,
    marginBottom: 12,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  checkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22d3ee',
    marginLeft: 8,
  },
  missionCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  missionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  missionText: {
    fontSize: 16,
    color: '#e2e8f0',
    lineHeight: 24,
    textAlign: 'center',
  },
  // Contact Us Section Styles
  contactCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  contactHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  contactTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  contactSubtitle: {
    fontSize: 16,
    color: '#e2e8f0',
  },
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  contactItem: {
    width: width < 400 ? '100%' : '48%',
    alignItems: 'center',
    marginBottom: 20,
  },
  contactIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
    textAlign: 'center',
  },
  contactItemText: {
    fontSize: 14,
    color: '#e2e8f0',
    textAlign: 'center',
    lineHeight: 20,
  },
  phoneLink: {
    color: '#22d3ee',
  },
  supportCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  supportContent: {
    flexDirection: 'column',
  },
  supportInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  mailIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  supportText: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  supportSubtitle: {
    fontSize: 14,
    color: '#e2e8f0',
  },
  contactSection: {
    alignItems: 'center',
  },
  contactLabel: {
    fontSize: 14,
    color: '#e2e8f0',
    marginBottom: 12,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emailButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  disclaimerCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)',
  },
  disclaimerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  disclaimerText: {
    flex: 1,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  disclaimerBody: {
    fontSize: 12,
    color: 'white',
    lineHeight: 18,
  },
  // Enhanced Footer Styles
  footer: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  footerLinksSection: {
    marginBottom: 24,
  },
  footerLinksTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  footerLinksSubtitle: {
    fontSize: 14,
    color: '#e2e8f0',
    textAlign: 'center',
    marginBottom: 24,
  },
  footerLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerLinkCard: {
    width: width < 400 ? '100%' : '48%',
    marginBottom: 12,
  },
  footerLinkCardInner: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  footerLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  footerLinkContent: {
    flex: 1,
  },
  footerLinkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  footerLinkDescription: {
    fontSize: 12,
    color: '#94a3b8',
  },
  footerDivider: {
    height: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    marginVertical: 24,
  },
  copyrightSection: {
    alignItems: 'center',
  },
  copyrightLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  copyrightLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  copyrightText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  copyrightSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});

export default AboutPage;