import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  BackHandler,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import API_BASE_URL from "./ApiConfig";

const TokenWithdrawal = () => {
  const [userData, setUserData] = useState(null);
  const [binaryTokens, setBinaryTokens] = useState(0);
  const [wonTokens, setWonTokens] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [netAmount, setNetAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [taxPercentage, setTaxPercentage] = useState(23);
  const [submitting, setSubmitting] = useState(false);
  const [canWithdraw, setCanWithdraw] = useState(true);
  const [withdrawalMessage, setWithdrawalMessage] = useState("");
  const [tokenType, setTokenType] = useState("binaryTokens"); // "binaryTokens" or "wonTokens"

  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem("userData");
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          fetchUserProfile(parsedData.phoneNo);
        } else {
          setError("No user data found. Please login again.");
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setError("Error retrieving user data");
        setLoading(false);
      }
    };

    fetchUserData();

    // Handle back button press
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (!submitting) {
          navigation.goBack();
        }
        return true;
      }
    );

    return () => backHandler.remove();
  }, [navigation, submitting]);

  // Check if today is Sunday
  const isSunday = () => {
    const today = new Date();
    return today.getDay() === 0; // 0 represents Sunday
  };

  // Validate amount format (allows 1 decimal place)
  const validateAmountFormat = (amount) => {
    const regex = /^\d+(\.\d)?$/;
    return regex.test(amount);
  };

  // Format number to 1 decimal place
  const formatToOneDecimal = (num) => {
    return parseFloat(num).toFixed(1);
  };

  // Handle amount input change with decimal validation
  const handleAmountChange = (value) => {
    // Allow only numbers and one decimal point
    let newValue = value.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const decimalCount = (newValue.match(/\./g) || []).length;
    if (decimalCount > 1) {
      newValue = newValue.substring(0, newValue.lastIndexOf('.'));
    }
    
    // Limit to 1 decimal place
    if (newValue.includes('.')) {
      const parts = newValue.split('.');
      if (parts[1].length > 1) {
        newValue = parts[0] + '.' + parts[1].substring(0, 1);
      }
    }
    
    setWithdrawAmount(newValue);
  };

  const checkWithdrawalEligibility = (userDataObj) => {
    if (tokenType === "binaryTokens") {
      // Binary tokens can only be withdrawn on Sundays
      if (isSunday()) {
        setCanWithdraw(true);
        setWithdrawalMessage("✅ You can withdraw your binary tokens today (Sunday).");
      } else {
        setCanWithdraw(false);
        const nextSunday = new Date();
        nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));
        const formattedDate = nextSunday.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        setWithdrawalMessage(`⏳ Binary tokens can only be withdrawn on Sundays. Next withdrawal: ${formattedDate}`);
      }
    } else {
      // Won tokens can be withdrawn anytime
      setCanWithdraw(true);
      setWithdrawalMessage("✅ You can withdraw your won tokens anytime.");
    }
  };

  const showToast = (type, title, message = "") => {
    if (type === "error") {
      Alert.alert(title, message, [{ text: "OK" }]);
    } else if (type === "success") {
      Alert.alert(title, message, [{ text: "OK" }]);
    } else if (type === "warning") {
      Alert.alert(title, message, [{ text: "OK" }]);
    }
  };

  const fetchUserProfile = async (phoneNo) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/user-profile/json/${phoneNo}`
      );

      if (response.data.success) {
        setUserData(response.data.userData);
        setBinaryTokens(response.data.userData.binaryTokens || 0);
        // Use lowercase 'wontokens' to match database
        setWonTokens(response.data.userData.wontokens || 0);

        // Check withdrawal eligibility
        checkWithdrawalEligibility(response.data.userData);

        if (response.data.userData.bankingDetails) {
          const details = Object.values(response.data.userData.bankingDetails);
          const verified = details.find((d) => d.status === "verified");
          if (verified?.bankAccountNo) {
            setSelectedOption("bank-" + verified.bankAccountNo);
          } else if (verified?.upiId) {
            setSelectedOption("upi-" + verified.upiId);
          }
        }
      } else {
        setError(response.data.message || "User not found");
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching user profile");
    } finally {
      setLoading(false);
    }
  };

  // Update tax calculation when token type or amount changes
  useEffect(() => {
    if (withdrawAmount && parseFloat(withdrawAmount) > 0) {
      const amt = parseFloat(withdrawAmount);
      // Different tax rates for different token types
      const taxRate = tokenType === "binaryTokens" ? 0.23 : 0.30;
      const tax = parseFloat((amt * taxRate).toFixed(1));
      const net = parseFloat((amt - tax).toFixed(1));
      setTaxAmount(tax);
      setNetAmount(net);
      setTaxPercentage(tokenType === "binaryTokens" ? 23 : 30);
    } else {
      setTaxAmount(0);
      setNetAmount(0);
      setTaxPercentage(tokenType === "binaryTokens" ? 23 : 30);
    }
  }, [withdrawAmount, tokenType]);

  // Update withdrawal message when token type changes
  useEffect(() => {
    if (userData) {
      checkWithdrawalEligibility(userData);
    }
  }, [tokenType]);

  const getCurrentBalance = () => {
    return tokenType === "binaryTokens" ? binaryTokens : wonTokens;
  };

  const getTokenTypeDisplayName = () => {
    return tokenType === "binaryTokens" ? "Binary Tokens" : "Won Tokens";
  };

  const getEndpointUrl = () => {
    return tokenType === "binaryTokens" 
      ? `${API_BASE_URL}/request-withdrawal`
      : `${API_BASE_URL}/request-won-withdrawal`;
  };

  const handleWithdraw = async () => {
    if (!canWithdraw) {
      showToast("error", "Withdrawals are not allowed at this time. Please check the withdrawal schedule.");
      return;
    }

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      showToast("warning", "Please enter a valid amount");
      return;
    }

    // Validate amount format (allows 1 decimal place)
    if (!validateAmountFormat(withdrawAmount)) {
      showToast("warning", "Only 1 decimal place allowed (e.g., 10.5)");
      return;
    }

    const amount = parseFloat(withdrawAmount);
    const currentBalance = getCurrentBalance();
    
    if (amount > currentBalance) {
      showToast("error", `You don't have enough ${getTokenTypeDisplayName().toLowerCase()}`);
      return;
    }
    
    if (!selectedOption) {
      showToast("warning", "Please select a withdrawal method");
      return;
    }

    const allDetails = userData?.bankingDetails
      ? Object.values(userData.bankingDetails)
      : [];

    const selectedDetail = allDetails.find((d) =>
      selectedOption.includes(d.bankAccountNo || d.upiId)
    );

    try {
      setSubmitting(true);

      const response = await axios.post(
        getEndpointUrl(),
        {
          phoneNo: userData.phoneNo,
          tokens: amount,
          method: selectedDetail?.bankAccountNo
            ? `Bank - ${selectedDetail.bankAccountNo}`
            : `UPI - ${selectedDetail?.upiId}`,
        }
      );

      if (response.status === 200) {
        showToast(
          "success",
          `${getTokenTypeDisplayName()} withdrawal successful!`,
          `Requested: ${formatToOneDecimal(withdrawAmount)}, After Tax (${taxPercentage}%): ${formatToOneDecimal(netAmount)}`
        );
        
        // Update respective token balance
        if (tokenType === "binaryTokens") {
          setBinaryTokens((prev) => parseFloat((prev - amount).toFixed(1)));
        } else {
          setWonTokens((prev) => parseFloat((prev - amount).toFixed(1)));
        }
        
        setWithdrawAmount("");
        setNetAmount(0);
        setTaxAmount(0);
        
        // Update AsyncStorage
        const storedData = JSON.parse(await AsyncStorage.getItem('userData'));
        if (storedData) {
          if (tokenType === "binaryTokens") {
            storedData.binaryTokens = parseFloat((binaryTokens - amount).toFixed(1));
          } else {
            // Use lowercase 'wontokens' to match database
            storedData.wontokens = parseFloat((wonTokens - amount).toFixed(1));
          }
          await AsyncStorage.setItem('userData', JSON.stringify(storedData));
        }
      } else {
        showToast("error", response.data.error || "Withdrawal failed");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error submitting withdrawal");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading your withdrawal details...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.homeButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const bankingDetails = userData?.bankingDetails
    ? Object.values(userData.bankingDetails)
    : [];

  const hasVerified = bankingDetails.some((d) => d.status === "verified");

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, submitting && styles.disabledButton]}
          onPress={() => navigation.goBack()}
          disabled={submitting}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerIcon}>💸</Text>
        <Text style={styles.headerTitle}>Token Withdrawal</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Token Type Selection */}
        <View style={styles.tokenTypeSection}>
          <Text style={styles.sectionTitle}>Select Token Type</Text>
          <View style={styles.tokenTypeButtons}>
            <TouchableOpacity
              style={[
                styles.tokenTypeButton,
                tokenType === "binaryTokens" && styles.binaryTokenButtonActive,
              ]}
              onPress={() => setTokenType("binaryTokens")}
            >
              <Text style={[
                styles.tokenTypeButtonText,
                tokenType === "binaryTokens" && styles.binaryTokenButtonTextActive,
              ]}>
                Binary Tokens
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tokenTypeButton,
                tokenType === "wonTokens" && styles.wonTokenButtonActive,
              ]}
              onPress={() => setTokenType("wonTokens")}
            >
              <Text style={[
                styles.tokenTypeButtonText,
                tokenType === "wonTokens" && styles.wonTokenButtonTextActive,
              ]}>
                Won Tokens
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Token Balance Cards */}
        <View style={styles.tokenBalanceCards}>
          {/* Binary Tokens Balance */}
          <TouchableOpacity
            style={[
              styles.tokenBalanceCard,
              tokenType === "binaryTokens" ? styles.binaryBalanceCardActive : styles.binaryBalanceCardInactive,
            ]}
            onPress={() => setTokenType("binaryTokens")}
          >
            <Text style={[
              styles.tokenBalanceLabel,
              tokenType === "binaryTokens" ? styles.binaryBalanceLabelActive : styles.binaryBalanceLabelInactive,
            ]}>
              Binary Tokens
            </Text>
            <Text style={[
              styles.tokenBalanceAmount,
              tokenType === "binaryTokens" ? styles.binaryBalanceAmountActive : styles.binaryBalanceAmountInactive,
            ]}>
              {formatToOneDecimal(binaryTokens)}
            </Text>
            <Text style={styles.tokenTaxText}>23% tax</Text>
          </TouchableOpacity>

          {/* Won Tokens Balance */}
          <TouchableOpacity
            style={[
              styles.tokenBalanceCard,
              tokenType === "wonTokens" ? styles.wonBalanceCardActive : styles.wonBalanceCardInactive,
            ]}
            onPress={() => setTokenType("wonTokens")}
          >
            <Text style={[
              styles.tokenBalanceLabel,
              tokenType === "wonTokens" ? styles.wonBalanceLabelActive : styles.wonBalanceLabelInactive,
            ]}>
              Won Tokens
            </Text>
            <Text style={[
              styles.tokenBalanceAmount,
              tokenType === "wonTokens" ? styles.wonBalanceAmountActive : styles.wonBalanceAmountInactive,
            ]}>
              {formatToOneDecimal(wonTokens)}
            </Text>
            <Text style={styles.tokenTaxText}>30% tax</Text>
          </TouchableOpacity>
        </View>

        {/* Withdrawal Eligibility Notice */}
        <View style={[
          styles.eligibilityNotice,
          canWithdraw ? styles.eligibilityNoticeSuccess : styles.eligibilityNoticeWarning,
        ]}>
          <Text style={styles.eligibilityIcon}>{canWithdraw ? '✅' : '⏳'}</Text>
          <View style={styles.eligibilityContent}>
            <Text style={[
              styles.eligibilityTitle,
              canWithdraw ? styles.eligibilityTitleSuccess : styles.eligibilityTitleWarning,
            ]}>
              {canWithdraw ? 'Withdrawal Available' : 'Withdrawal Schedule'}
            </Text>
            <Text style={[
              styles.eligibilityMessage,
              canWithdraw ? styles.eligibilityMessageSuccess : styles.eligibilityMessageWarning,
            ]}>
              {withdrawalMessage}
            </Text>
          </View>
        </View>

        {bankingDetails.length === 0 ? (
          <View style={styles.noBankDetails}>
            <View style={styles.warningIconContainer}>
              <Text style={styles.warningIcon}>⚠️</Text>
            </View>
            <Text style={styles.noBankTitle}>Banking Details Required</Text>
            <Text style={styles.noBankText}>
              Please add and verify your banking details to proceed with withdrawal
            </Text>
            <TouchableOpacity
              style={styles.addBankButton}
              onPress={() => navigation.navigate("BankDetails")}
            >
              <Text style={styles.addBankButtonText}>Add Bank Details</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Payment Methods */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Withdrawal Method</Text>
              
              <View style={styles.paymentMethods}>
                {bankingDetails.map((detail, index) => {
                  const isBank = !!detail.bankAccountNo;
                  const isVerified = detail.status === "verified";
                  const value = isBank
                    ? "bank-" + detail.bankAccountNo
                    : "upi-" + detail.upiId;

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.paymentMethod,
                        selectedOption === value && styles.selectedPaymentMethod,
                        (!isVerified || !canWithdraw) && styles.disabledPaymentMethod,
                      ]}
                      onPress={(isVerified && canWithdraw) ? () => setSelectedOption(value) : undefined}
                      disabled={!isVerified || !canWithdraw}
                    >
                      <View style={styles.paymentMethodContent}>
                        <View style={styles.radioContainer}>
                          <View
                            style={[
                              styles.radioOuter,
                              selectedOption === value && styles.radioOuterSelected,
                            ]}
                          >
                            {selectedOption === value && (
                              <View style={styles.radioInner} />
                            )}
                          </View>
                        </View>
                        
                        <View
                          style={[
                            styles.methodIcon,
                            isBank ? styles.bankIcon : styles.upiIcon,
                          ]}
                        >
                          <Text style={styles.methodIconText}>
                            {isBank ? "🏦" : "📱"}
                          </Text>
                        </View>
                        
                        <View style={styles.methodDetails}>
                          <Text style={styles.methodType}>
                            {isBank ? "Bank Account" : "UPI Payment"}
                          </Text>
                          <Text style={styles.methodInfo}>
                            {isBank
                              ? `${detail.bankAccountNo} • ${detail.ifsc}`
                              : detail.upiId
                            }
                          </Text>
                        </View>
                        
                        <View
                          style={[
                            styles.verifiedBadge,
                            isVerified
                              ? styles.verifiedBadgeActive
                              : styles.verifiedBadgeInactive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.verifiedText,
                              isVerified
                                ? styles.verifiedTextActive
                                : styles.verifiedTextInactive,
                            ]}
                          >
                            {isVerified ? "Verified" : "Unverified"}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Withdrawal Amount */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Withdrawal Amount ({getTokenTypeDisplayName()})</Text>
              <View style={styles.amountInputContainer}>
                <TextInput
                  style={[
                    styles.amountInput,
                    (!hasVerified || !canWithdraw) && styles.disabledInput,
                  ]}
                  placeholder={`Enter ${getTokenTypeDisplayName().toLowerCase()} to withdraw`}
                  value={withdrawAmount}
                  onChangeText={handleAmountChange}
                  keyboardType="decimal-pad"
                  editable={hasVerified && canWithdraw}
                  placeholderTextColor="#9ca3af"
                />
                <Text style={styles.amountSuffix}>tokens</Text>
              </View>
            </View>

            {/* Tax Calculation */}
            {withdrawAmount && netAmount > 0 && (
              <View style={styles.taxContainer}>
                <View style={styles.taxRow}>
                  <View style={styles.taxColumn}>
                    <Text style={styles.taxLabel}>Requested</Text>
                    <Text style={styles.taxValueRequested}>
                      {formatToOneDecimal(withdrawAmount)}
                    </Text>
                  </View>
                  <View style={styles.taxColumn}>
                    <Text style={styles.taxLabel}>Tax ({taxPercentage}%)</Text>
                    <Text style={styles.taxValueDeducted}>
                      -{formatToOneDecimal(taxAmount)}
                    </Text>
                  </View>
                  <View style={styles.taxColumn}>
                    <Text style={styles.taxLabel}>You Receive</Text>
                    <Text style={styles.taxValueNet}>
                      {formatToOneDecimal(netAmount)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Withdraw Button */}
            <TouchableOpacity
              style={[
                styles.withdrawButton,
                (!hasVerified || !canWithdraw || submitting || !withdrawAmount || !validateAmountFormat(withdrawAmount)) &&
                  styles.disabledWithdrawButton,
                tokenType === 'binaryTokens' ? styles.binaryWithdrawButton : styles.wonWithdrawButton,
              ]}
              onPress={handleWithdraw}
              disabled={!hasVerified || !canWithdraw || submitting || !withdrawAmount || !validateAmountFormat(withdrawAmount)}
            >
              {submitting ? (
                <View style={styles.submittingContainer}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.withdrawButtonText}>
                    Processing Withdrawal...
                  </Text>
                </View>
              ) : (
                <Text style={styles.withdrawButtonText}>Withdraw {getTokenTypeDisplayName()}</Text>
              )}
            </TouchableOpacity>

            {/* Info Section */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Important Information</Text>
                <Text style={styles.infoText}>
                  • Won tokens: Can be withdrawn anytime{'\n'}
                  • Binary tokens: Can only be withdrawn on Sundays{'\n'}
                  • Binary tokens: 23% tax, Won tokens: 30% tax{'\n'}
                  • Only 1 decimal place allowed for amounts (e.g., 10.5){'\n'}
                  • Only verified payment methods can be used{'\n'}
                  • Binary tokens and won tokens are withdrawn separately
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#2563eb",
    padding: 20,
    paddingTop: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 15,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  backButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.5,
  },
  headerIcon: {
    fontSize: 32,
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    margin: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  // Token Type Selection
  tokenTypeSection: {
    marginBottom: 20,
  },
  tokenTypeButtons: {
    flexDirection: "row",
    gap: 12,
  },
  tokenTypeButton: {
    flex: 1,
    padding: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },
  binaryTokenButtonActive: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  wonTokenButtonActive: {
    borderColor: "#10b981",
    backgroundColor: "#f0fdf4",
  },
  tokenTypeButtonText: {
    fontWeight: "600",
    textAlign: "center",
    color: "#6b7280",
    fontSize: 14,
  },
  binaryTokenButtonTextActive: {
    color: "#2563eb",
  },
  wonTokenButtonTextActive: {
    color: "#10b981",
  },
  // Token Balance Cards
  tokenBalanceCards: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  tokenBalanceCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
  },
  binaryBalanceCardActive: {
    backgroundColor: "#eff6ff",
    borderColor: "#2563eb",
  },
  binaryBalanceCardInactive: {
    backgroundColor: "#f8fafc",
    borderColor: "#e5e7eb",
  },
  wonBalanceCardActive: {
    backgroundColor: "#f0fdf4",
    borderColor: "#10b981",
  },
  wonBalanceCardInactive: {
    backgroundColor: "#f8fafc",
    borderColor: "#e5e7eb",
  },
  tokenBalanceLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  binaryBalanceLabelActive: {
    color: "#2563eb",
  },
  binaryBalanceLabelInactive: {
    color: "#64748b",
  },
  wonBalanceLabelActive: {
    color: "#10b981",
  },
  wonBalanceLabelInactive: {
    color: "#64748b",
  },
  tokenBalanceAmount: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  binaryBalanceAmountActive: {
    color: "#1e40af",
  },
  binaryBalanceAmountInactive: {
    color: "#1e293b",
  },
  wonBalanceAmountActive: {
    color: "#047857",
  },
  wonBalanceAmountInactive: {
    color: "#1e293b",
  },
  tokenTaxText: {
    color: "#64748b",
    fontSize: 12,
  },
  // Eligibility Notice
  eligibilityNotice: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  eligibilityNoticeSuccess: {
    backgroundColor: "#f0fdf4",
    borderColor: "#10b981",
  },
  eligibilityNoticeWarning: {
    backgroundColor: "#fffbeb",
    borderColor: "#f59e0b",
  },
  eligibilityIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  eligibilityContent: {
    flex: 1,
  },
  eligibilityTitle: {
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 6,
  },
  eligibilityTitleSuccess: {
    color: "#065f46",
  },
  eligibilityTitleWarning: {
    color: "#92400e",
  },
  eligibilityMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  eligibilityMessageSuccess: {
    color: "#065f46",
  },
  eligibilityMessageWarning: {
    color: "#92400e",
  },
  // Other existing styles remain the same...
  noBankDetails: {
    alignItems: "center",
    paddingVertical: 30,
  },
  warningIconContainer: {
    backgroundColor: "#fef3c7",
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  warningIcon: {
    fontSize: 36,
  },
  noBankTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
    textAlign: "center",
  },
  noBankText: {
    color: "#6b7280",
    marginBottom: 20,
    textAlign: "center",
  },
  addBankButton: {
    backgroundColor: "#f59e0b",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  addBankButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: "600",
    color: "#374151",
    fontSize: 16,
    marginBottom: 12,
  },
  paymentMethods: {
    gap: 12,
  },
  paymentMethod: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "white",
  },
  selectedPaymentMethod: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  disabledPaymentMethod: {
    opacity: 0.6,
  },
  paymentMethodContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioContainer: {
    marginRight: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: "#2563eb",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2563eb",
  },
  methodIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  bankIcon: {
    backgroundColor: "#dbeafe",
  },
  upiIcon: {
    backgroundColor: "#dcfce7",
  },
  methodIconText: {
    fontSize: 16,
  },
  methodDetails: {
    flex: 1,
  },
  methodType: {
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 4,
    color: "#1f2937",
  },
  methodInfo: {
    color: "#6b7280",
    fontSize: 14,
  },
  verifiedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedBadgeActive: {
    backgroundColor: "#dcfce7",
  },
  verifiedBadgeInactive: {
    backgroundColor: "#f3f4f6",
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: "500",
  },
  verifiedTextActive: {
    color: "#166534",
  },
  verifiedTextInactive: {
    color: "#6b7280",
  },
  amountInputContainer: {
    position: "relative",
  },
  amountInput: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: "white",
    paddingRight: 70,
    color: '#000000'
  },
  disabledInput: {
    backgroundColor: "#f9fafb",
  },
  amountSuffix: {
    position: "absolute",
    right: 14,
    top: "50%",
    transform: [{ translateY: -10 }],
    color: "#9ca3af",
    fontSize: 16,
  },
  taxContainer: {
    backgroundColor: "#f0fdf4",
    borderWidth: 2,
    borderColor: "#10b981",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  taxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taxColumn: {
    flex: 1,
    alignItems: "center",
  },
  taxLabel: {
    color: "#065f46",
    fontSize: 12,
    marginBottom: 5,
  },
  taxValueRequested: {
    fontWeight: "700",
    color: "#065f46",
    fontSize: 16,
  },
  taxValueDeducted: {
    fontWeight: "700",
    color: "#dc2626",
    fontSize: 16,
  },
  taxValueNet: {
    fontWeight: "700",
    color: "#065f46",
    fontSize: 18,
  },
  withdrawButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  binaryWithdrawButton: {
    backgroundColor: "#2563eb",
  },
  wonWithdrawButton: {
    backgroundColor: "#10b981",
  },
  disabledWithdrawButton: {
    backgroundColor: "#9ca3af",
  },
  submittingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  withdrawButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  infoContainer: {
    backgroundColor: "#fffbeb",
    borderWidth: 2,
    borderColor: "#f59e0b",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontWeight: "600",
    color: "#92400e",
    fontSize: 14,
    marginBottom: 8,
  },
  infoText: {
    color: "#92400e",
    fontSize: 12,
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 15,
    color: "#6b7280",
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  errorContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorText: {
    color: "#dc2626",
    marginBottom: 15,
    textAlign: "center",
  },
  homeButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  homeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default TokenWithdrawal;