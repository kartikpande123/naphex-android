import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 100, // Space for help button
  },

  // Logo Section
  logoSection: {
    alignItems: 'flex-start',
    marginBottom: 10,
    marginTop:13
  },
  companyLogo: {
    width: 140,
    height: 50,
    backgroundColor: '#42a5f5',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#42a5f5',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },

  // Header Section
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  companyHeader: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a2a44',
    textAlign: 'center',
    letterSpacing: 1.5,
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  companyBrand: {
    fontSize: 32,
    fontWeight: '900',
    color: '#42a5f5',
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },

  // Main Content
  mainContent: {
    flex: 1,
  },

  // Quick Links Section
  linksContainer: {
    backgroundColor: 'rgba(26, 42, 68, 0.95)',
    borderRadius: 24,
    padding: 30,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 25,
    },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 15,
    borderWidth: 2,
    borderColor: 'rgba(66, 165, 245, 0.2)',
  },
  mobileLinks: {
    marginTop: 25,
    padding: 25,
  },
  linksHeader: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 25,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    letterSpacing: 1,
  },
  navLinks: {
    gap: 15,
  },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(52, 73, 94, 0.8)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },

  // Individual link colors
  navLinkTerms: {
    borderColor: '#42a5f5',
  },
  navLinkKyc: {
    borderColor: '#4caf50',
  },
  navLinkPrivacy: {
    borderColor: '#ff9800',
  },
  navLinkAbout: {
    borderColor: '#e91e63',
  },
  navLinkStatus: {
    borderColor: '#9c27b0',
  },

  linkIcon: {
    fontSize: 20,
    marginRight: 15,
    opacity: 0.9,
  },
  linkText: {
    flex: 1,
    color: '#ecf0f1',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  linkArrow: {
    color: '#ecf0f1',
    fontSize: 18,
    opacity: 0.7,
    fontWeight: 'bold',
  },

  // Form Section
  formSection: {
    marginBottom: 20,
  },
  loginCard: {
    backgroundColor: 'rgba(26, 42, 68, 0.95)',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    backgroundColor: '#42a5f5',
    padding: 25,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    marginTop: 6,
  },
  cardBody: {
    padding: 25,
    backgroundColor: '#1a2a44',
  },

  // Alert
  alert: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  alertText: {
    color: '#e74c3c',
    fontSize: 14,
    textAlign: 'center',
  },

  // Form Elements
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    color: '#ecf0f1',
    fontWeight: '500',
    marginBottom: 6,
    fontSize: 14,
  },
  formControl: {
    width: '100%',
    padding: 14,
    backgroundColor: 'rgba(52, 73, 94, 0.8)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    color: '#ffffff',
    fontSize: 16,
  },
  passwordInputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    paddingRight: 50,
  },
  passwordToggle: {
    position: 'absolute',
    right: 15,
    borderRadius: 6,
    width: 35,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Button
  btnPrimary: {
    width: '100%',
    padding: 14,
    backgroundColor: '#42a5f5',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#42a5f5',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  btnDisabled: {
    backgroundColor: 'rgba(108, 117, 125, 0.6)',
    opacity: 0.7,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  spinner: {
    marginRight: 8,
  },

  // Forgot Password Link
  forgotPasswordLink: {
    alignItems: 'center',
    marginTop: 15,
  },
  forgotPasswordText: {
    color: '#42a5f5',
    fontSize: 14,
    fontWeight: '500',
  },

  // Card Footer
  cardFooter: {
    backgroundColor: 'rgba(42, 82, 152, 0.3)',
    padding: 18,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardFooterText: {
    color: '#bdc3c7',
    fontSize: 14,
  },
  signupLink: {
    color: '#42a5f5',
    fontWeight: '500',
  },

  // Footer
  footer: {
    backgroundColor: 'rgba(26, 42, 68, 0.9)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    color: '#bdc3c7',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Help Button
  helpButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#ff6b35',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#ff6b35',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 3,
    borderColor: '#ffffff',
    gap: 8,
  },
  helpButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Responsive Design for smaller screens
  ...(width < 380 && {
    scrollContainer: {
      paddingHorizontal: 10,
    },
    companyHeader: {
      fontSize: 20,
    },
    companyBrand: {
      fontSize: 28,
    },
    linksContainer: {
      padding: 20,
    },
    cardBody: {
      padding: 20,
    },
    formControl: {
      padding: 12,
    },
    btnPrimary: {
      padding: 12,
    },
    companyLogo: {
      width: 120,
      height: 40,
    },
  }),
});

export default styles;