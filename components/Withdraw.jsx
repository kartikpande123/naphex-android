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

const Withdraw = () => {
  const [userData, setUserData] = useState(null);
  const [tokens, setTokens] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [netAmount, setNetAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [canWithdraw, setCanWithdraw] = useState(false);
  const [withdrawalMessage, setWithdrawalMessage] = useState("");

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

  const checkWithdrawalEligibility = (userDataObj) => {
    const currentDate = new Date();
    const currentDay = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTimestamp = currentDate.getTime();

    // Check if today is Sunday
    const isSunday = currentDay === 0;

    // Check for recent wins within 48 hours
    let hasRecentWin = false;
    let latestWinTime = null;

    if (userDataObj.game1 && userDataObj.game1.wins) {
      const wins = userDataObj.game1.wins;
      const winsArray = Object.values(wins);

      // Find the most recent win
      winsArray.forEach((win) => {
        if (win.timestamp) {
          const winTime = win.timestamp;
          const timeDiff = currentTimestamp - winTime;
          const hoursDiff = timeDiff / (1000 * 60 * 60);

          if (hoursDiff <= 48) {
            hasRecentWin = true;
            if (!latestWinTime || winTime > latestWinTime) {
              latestWinTime = winTime;
            }
          }
        }
      });
    }

    // Determine eligibility and message
    if (isSunday) {
      setCanWithdraw(true);
      setWithdrawalMessage("✅ Today is Sunday! You can withdraw your tokens.");
    } else if (hasRecentWin && latestWinTime) {
      setCanWithdraw(true);
      const hoursLeft = 48 - ((currentTimestamp - latestWinTime) / (1000 * 60 * 60));
      const hoursLeftRounded = Math.ceil(hoursLeft);
      setWithdrawalMessage(
        `✅ Congratulations on your recent win! You have ${hoursLeftRounded} hours left to withdraw.`
      );
    } else {
      setCanWithdraw(false);
      // Calculate days until next Sunday
      const daysUntilSunday = (7 - currentDay) % 7 || 7;
      setWithdrawalMessage(
        `⏰ Withdrawals are only allowed on Sundays or within 48 hours of a win. Next Sunday is in ${daysUntilSunday} day${daysUntilSunday > 1 ? 's' : ''}.`
      );
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
        setTokens(response.data.tokens);

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

  useEffect(() => {
    if (withdrawAmount && parseInt(withdrawAmount) > 0) {
      const amt = parseInt(withdrawAmount);
      const tax = Math.floor(amt * 0.3);
      setNetAmount(amt - tax);
    } else {
      setNetAmount(0);
    }
  }, [withdrawAmount]);

  const handleWithdraw = async () => {
    if (!canWithdraw) {
      showToast("error", "Withdrawals are not allowed at this time. Please check the withdrawal schedule.");
      return;
    }

    if (!withdrawAmount || parseInt(withdrawAmount) <= 0) {
      showToast("warning", "Please enter a valid amount");
      return;
    }
    if (parseInt(withdrawAmount) > tokens) {
      showToast("error", "You don't have enough tokens");
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
        `${API_BASE_URL}/request-withdrawal`,
        {
          phoneNo: userData.phoneNo,
          tokens: parseInt(withdrawAmount),
          method: selectedDetail?.bankAccountNo
            ? `Bank - ${selectedDetail.bankAccountNo}`
            : `UPI - ${selectedDetail?.upiId}`,
        }
      );

      if (response.status === 200) {
        showToast(
          "success", 
          "Withdrawal successful!", 
          `Requested: ${withdrawAmount}, After Tax (30%): ${netAmount}`
        );
        setTokens((prev) => prev - parseInt(withdrawAmount));
        setWithdrawAmount("");
        setNetAmount(0);
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
        {/* Token Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>{tokens.toLocaleString()} tokens</Text>
        </View>

        {/* Withdrawal Eligibility Notice */}
        <View style={[
          styles.eligibilityNotice,
          canWithdraw ? styles.eligibilityNoticeSuccess : styles.eligibilityNoticeError
        ]}>
          <Text style={styles.eligibilityIcon}>{canWithdraw ? '✅' : '⏰'}</Text>
          <View style={styles.eligibilityContent}>
            <Text style={[
              styles.eligibilityTitle,
              canWithdraw ? styles.eligibilityTitleSuccess : styles.eligibilityTitleError
            ]}>
              {canWithdraw ? 'Withdrawal Available' : 'Withdrawal Restricted'}
            </Text>
            <Text style={[
              styles.eligibilityMessage,
              canWithdraw ? styles.eligibilityMessageSuccess : styles.eligibilityMessageError
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
              <Text style={styles.sectionTitle}>Withdrawal Amount</Text>
              <View style={styles.amountInputContainer}>
                <TextInput
                  style={[
                    styles.amountInput,
                    (!hasVerified || !canWithdraw) && styles.disabledInput,
                  ]}
                  placeholder="Enter tokens to withdraw"
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                  keyboardType="numeric"
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
                      {parseInt(withdrawAmount).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.taxColumn}>
                    <Text style={styles.taxLabel}>Tax (30%)</Text>
                    <Text style={styles.taxValueDeducted}>
                      -{(parseInt(withdrawAmount) - netAmount).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.taxColumn}>
                    <Text style={styles.taxLabel}>You Receive</Text>
                    <Text style={styles.taxValueNet}>
                      {netAmount.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Withdraw Button */}
            <TouchableOpacity
              style={[
                styles.withdrawButton,
                (!hasVerified || !canWithdraw || submitting || !withdrawAmount) &&
                  styles.disabledWithdrawButton,
              ]}
              onPress={handleWithdraw}
              disabled={!hasVerified || !canWithdraw || submitting || !withdrawAmount}
            >
              {submitting ? (
                <View style={styles.submittingContainer}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.withdrawButtonText}>
                    Processing Withdrawal...
                  </Text>
                </View>
              ) : (
                <Text style={styles.withdrawButtonText}>Withdraw Tokens</Text>
              )}
            </TouchableOpacity>

            {/* Info Section */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Important Information</Text>
                <Text style={styles.infoText}>
                  • Withdrawals are available only on Sundays{'\n'}
                  • Winners can withdraw within 48 hours of their win{'\n'}
                  • 30% tax is automatically deducted from all withdrawals{'\n'}
                  • Only verified payment methods can be used
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
  balanceCard: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  balanceLabel: {
    color: "#64748b",
    fontSize: 14,
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
  },
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
  eligibilityNoticeError: {
    backgroundColor: "#fef2f2",
    borderColor: "#ef4444",
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
  eligibilityTitleError: {
    color: "#991b1b",
  },
  eligibilityMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  eligibilityMessageSuccess: {
    color: "#065f46",
  },
  eligibilityMessageError: {
    color: "#991b1b",
  },
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
    backgroundColor: "#2563eb",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
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

export default Withdraw;