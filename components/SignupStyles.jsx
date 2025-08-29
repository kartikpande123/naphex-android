import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: 'rgba(26, 42, 68, 0.95)',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    marginTop:18
  },
  cardHeader: {
    backgroundColor: '#42a5f5',
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  brandName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    letterSpacing: 2,
  },
  cardBody: {
    padding: 20,
    backgroundColor: '#1a2a44',
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#42a5f5',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#42a5f5',
  },
  otpTitle: {
    color: '#42a5f5',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 18,
  },
  formLabel: {
    color: '#ecf0f1',
    fontWeight: '500',
    marginBottom: 8,
    fontSize: 14,
  },
  formControl: {
    width: '100%',
    padding: 16,
    backgroundColor: 'rgba(52, 73, 94, 0.8)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    color: '#ffffff',
    fontSize: 16,
    minHeight: 54,
  },
  disabledInput: {
    opacity: 0.6,
    backgroundColor: 'rgba(52, 73, 94, 0.4)',
  },
  errorInput: {
    borderColor: '#e74c3c',
  },
  validInput: {
    borderColor: '#2ecc71',
  },
  invalidInput: {
    borderColor: '#e74c3c',
  },
  inputGroup: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    paddingRight: 60, // Make space for the eye icon
  },
  toggleButton: {
    position: 'absolute',
    right: 0,
    height: 54,
    width: 54,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  toggleButtonText: {
    fontSize: 20,
    color: '#ecf0f1',
  },
  errorMessage: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 6,
    paddingLeft: 4,
  },
  validMessage: {
    color: '#2ecc71',
    fontSize: 12,
    marginTop: 6,
    paddingLeft: 4,
  },
  referralMessage: {
    fontSize: 12,
    marginTop: 6,
    paddingLeft: 4,
  },
  errorContainer: {
    marginTop: 6,
  },
  passwordRequirements: {
    backgroundColor: 'rgba(52, 73, 94, 0.5)',
    borderRadius: 10,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  passwordRequirementsTitle: {
    color: '#ecf0f1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  requirementsList: {
    margin: 0,
    padding: 0,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(236, 240, 241, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: 'transparent',
  },
  requirementMet: {
    backgroundColor: '#2ecc71',
    borderColor: '#2ecc71',
  },
  requirementIconText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  requirementText: {
    fontSize: 13,
    color: 'rgba(236, 240, 241, 0.8)',
    flex: 1,
    lineHeight: 18,
  },
  requirementMetText: {
    color: '#2ecc71',
    fontWeight: '500',
  },
  referralStatus: {
    marginTop: 12,
    padding: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  referralValid: {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.3)',
  },
  referralInvalid: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  referralChecking: {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52, 152, 219, 0.3)',
  },
  referrerName: {
    marginTop: 8,
    fontWeight: '500',
    fontSize: 12,
    width: '100%',
    color: '#ecf0f1',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingLeft: 4,
  },
  loadingText: {
    color: '#42a5f5',
    fontSize: 12,
    marginLeft: 8,
  },
  // Fixed layout - Remove two-column layout, make everything full width
  twoColumn: {
    flexDirection: 'column', // Changed from row to column
    gap: 0, // Remove gap since we're stacking vertically
  },
  columnItem: {
    flex: 1,
    width: '100%', // Ensure full width
    minWidth: 0,
  },
  picker: {
    color: '#fff',
    backgroundColor: 'transparent',
    height: 54,
  },
  pickerContainer: {
    backgroundColor: 'rgba(52, 73, 94, 0.8)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    minHeight: 54,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  pickerDisabled: {
    opacity: 0.6,
    backgroundColor: 'rgba(52, 73, 94, 0.4)',
  },
  otpSection: {
    backgroundColor: 'rgba(66, 165, 245, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(66, 165, 245, 0.25)',
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
    marginBottom: 8,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
  },
  otpActions: {
    alignItems: 'center',
    marginTop: 16,
  },
  timerText: {
    color: 'rgba(236, 240, 241, 0.8)',
    fontSize: 14,
    textAlign: 'center',
  },
  resendButton: {
    backgroundColor: '#42a5f5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#42a5f5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  resendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  // FORM ACTIONS SECTION - This is the main container for bottom buttons
  formActions: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  
  // PRIMARY BUTTON STYLES (Send OTP / Continue Button)
  primaryButton: {
    width: '100%',
    padding: 18,
    backgroundColor: '#42a5f5',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#42a5f5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    minHeight: 58,
    marginBottom: 20,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // SECONDARY BUTTON STYLES (Already have an account? Sign In)
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#42a5f5',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  
  // DISABLED BUTTON STATE
  disabledButton: {
    opacity: 0.6,
    backgroundColor: 'rgba(66, 165, 245, 0.6)',
    elevation: 2,
  },
  
  submitButton: {
    width: '100%',
    padding: 18,
    backgroundColor: '#42a5f5',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    elevation: 6,
    shadowColor: '#42a5f5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    minHeight: 58,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // NEW STYLES FOR SEND OTP BUTTON (Alternative style if needed)
  sendOtpButton: {
    width: '100%',
    padding: 16,
    backgroundColor: '#2ecc71',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    minHeight: 54,
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.3)',
  },
  sendOtpButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sendOtpButtonDisabled: {
    opacity: 0.6,
    backgroundColor: 'rgba(46, 204, 113, 0.5)',
    elevation: 2,
  },
  
  // NEW STYLES FOR BOTTOM SECTION
  bottomSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  signInPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },
  signInPromptText: {
    color: 'rgba(236, 240, 241, 0.8)',
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
  },
  signInLink: {
    color: '#42a5f5',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
    textDecorationLine: 'underline',
  },
  signInLinkPressed: {
    color: '#3498db',
    opacity: 0.8,
  },

  cardFooter: {
    backgroundColor: 'rgba(42, 82, 152, 0.3)',
    padding: 24,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    color: '#bdc3c7',
    fontSize: 14,
    textAlign: 'center',
  },
  footerLink: {
    color: '#42a5f5',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  alert: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  alertError: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  alertText: {
    color: '#e74c3c',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
});

export default styles;