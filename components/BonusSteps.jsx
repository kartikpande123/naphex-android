import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { height: screenHeight } = Dimensions.get('window');

const BonusSteps = ({ visible, onClose }) => {
  // Enhanced Color Scheme
  const colors = {
    primary: '#2563eb',
    secondary: '#7c3aed',
    accent: '#06b6d4',
    success: '#10b981',
    warning: '#f59e0b',
    lightBg: '#f8fafc',
    cardBg: '#ffffff',
    text: '#1e293b',
    textSecondary: '#64748b',
    white: '#ffffff',
    border: '#e2e8f0',
    shadow: 'rgba(0, 0, 0, 0.1)',
  };

  // Bonus Steps Data
  const bonusSteps = [
    { step: 1, amount: 1000 },
    { step: 2, amount: 2500 },
    { step: 3, amount: 5000 },
    { step: 4, amount: 10000 },
    { step: 5, amount: 25000 },
    { step: 6, amount: 50000 },
    { step: 7, amount: 100000 },
    { step: 8, amount: 250000 },
    { step: 9, amount: 500000 },
    { step: 10, amount: 1000000 },
    { step: 11, amount: 2500000 },
    { step: 12, amount: 5000000 },
    { step: 13, amount: 10000000 },
  ];

  // Format currency with Indian number system
  const formatCurrency = num => {
    return num.toLocaleString('en-IN');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.bonusStepsModalContent,
            { backgroundColor: colors.cardBg },
          ]}
        >
          {/* Header */}
          <View
            style={[styles.modalHeader, { backgroundColor: colors.primary }]}
          >
            <Icon name="stars" size={24} color={colors.white} />
            <Text style={[styles.modalTitle, { color: colors.white }]}>
              Bonus Steps
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.bonusStepsBody}>
            {/* Note Card */}
            <View
              style={[
                styles.bonusNoteCard,
                {
                  backgroundColor: colors.lightBg,
                  borderColor: colors.accent,
                },
              ]}
            >
              <Icon name="info" size={18} color={colors.accent} />
              <Text style={[styles.bonusNoteText, { color: colors.text }]}>
                Note: Reach these steps to get bonus from binary friends
              </Text>
            </View>

            {/* Scrollable Steps List */}
            <ScrollView
              style={styles.bonusStepsScrollView}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              contentContainerStyle={styles.scrollContentContainer}
              bounces={true}
            >
              {bonusSteps.map((item, index) => (
                <View
                  key={item.step}
                  style={[
                    styles.bonusStepItem,
                    {
                      backgroundColor:
                        index % 2 === 0 ? colors.lightBg : colors.white,
                      borderLeftColor: colors.primary,
                    },
                  ]}
                >
                  <View style={styles.bonusStepLeft}>
                    <View
                      style={[
                        styles.stepNumberBadge,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Text
                        style={[styles.stepNumberText, { color: colors.white }]}
                      >
                        {item.step}
                      </Text>
                    </View>
                    <Text style={[styles.stepLabelText, { color: colors.text }]}>
                      Step {item.step}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.bonusAmountBadge,
                      { backgroundColor: colors.success },
                    ]}
                  >
                    <Icon name="currency-rupee" size={16} color={colors.white} />
                    <Text
                      style={[styles.bonusAmountText, { color: colors.white }]}
                    >
                      {formatCurrency(item.amount)}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Footer */}
          <View style={styles.bonusStepsFooter}>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.bonusCloseButton,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={[styles.buttonText, { color: colors.white }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  bonusStepsModalContent: {
    width: '100%',
    maxWidth: 450,
    height: screenHeight * 0.85,
    borderRadius: 16,
    elevation: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  bonusStepsBody: {
    flex: 1,
    minHeight: 0,
  },
  bonusNoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    flexShrink: 0,
  },
  bonusNoteText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  bonusStepsScrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  bonusStepItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  bonusStepLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 2,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepLabelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bonusAmountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    elevation: 2,
  },
  bonusAmountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  bonusStepsFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  bonusCloseButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BonusSteps;