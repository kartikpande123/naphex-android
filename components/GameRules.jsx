import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const RulesAndRegulations = () => {
  return (
    <LinearGradient
      colors={['#f8f9ff', '#e6f3ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Enhanced Header */}
          <LinearGradient
            colors={['#0d6efd', '#6610f2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>Naphex</Text>
            <Text style={styles.headerSubtitle}>Rules and Regulations</Text>
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            <Section title="Exchange Rules & Regulations at Naphex">
              <Text style={styles.sectionText}>
                All terms and conditions are stated in English and take precedence over any translated versions. Ensure you understand and accept these before using the platform.
              </Text>
            </Section>

            <Section title="Naphex Bonus Guidelines">
              <BulletPoint text="Naphex provides several attractive bonus programs determined solely by the platform." />
              <BulletPoint text="Bonus amounts, terms, and conditions are non-negotiable and subject to change without prior notice." />
              <BulletPoint text="Refer to the notification section regularly for current bonus events." />
              <BulletPoint text="No disputes regarding bonus offers will be entertained; Naphex's decisions are final." />
              <BulletPoint text="Each bonus has specific terms like wagering requirements, expiry dates, and withdrawal caps. Always check bonus banners or your user account for details." />
              <BulletPoint text="If there is a conflict between promotional material and Naphex's terms, Naphex's terms will apply." />
            </Section>

            <Section title="Bonus Usage">
              <BulletPoint text="Bonuses have wagering requirements (often multiple times the bonus amount) and a fixed time to complete them." />
              <BulletPoint text="If requirements are met, the bonus converts to real money that can be withdrawn." />
              <BulletPoint text="Real money is used first before bonus money in games." />
              <BulletPoint text="All played games during the bonus period (real or bonus) contribute to the wagering goal." />
            </Section>

            <Section title="How to Get Your Welcome Bonus">
              <SubSection
                subtitle="Eligibility"
                text="Only first-time registered users are eligible, and the welcome bonus can only be claimed with the first deposit."
              />
              <SubSection
                subtitle="Bonus Restrictions"
                text="The welcome bonus cannot be combined with any other offer or promotion."
              />
              <SubSection
                subtitle="Technical Issues"
                text="Missed bonuses due to technical errors are not automatically added. Please contact support to resolve such cases."
              />
              <SubSection
                subtitle="Bonus Abuse"
                text="Any misuse or fraudulent activity may lead to cancellation of the bonus and permanent account closure."
              />
            </Section>

            <Section title="How to Claim Your Naphex Bonus">
              <LinearGradient
                colors={['#d1e7dd', '#a3d9a4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.claimBox}
              >
                <StepItem
                  number="1"
                  title="Register & Login:"
                  description="Create an account and log in."
                />
                <StepItem
                  number="2"
                  title="Deposit:"
                  description="Add funds through the 'Account' section."
                />
                <StepItem
                  number="3"
                  title="Claim:"
                  description="Automatically bonus will sent to your account according to binary Performance."
                />
                <StepItem
                  number="4"
                  title="Enjoy:"
                  description="Bonus everyday according to your Performance of binary."
                  isLast={true}
                />
              </LinearGradient>
            </Section>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <LinearGradient
        colors={['#0d6efd', '#6610f2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.sectionBar}
      />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

const SubSection = ({ subtitle, text }) => (
  <View style={styles.subSection}>
    <Text style={styles.subSectionTitle}>{subtitle}</Text>
    <Text style={styles.subSectionText}>{text}</Text>
  </View>
);

const BulletPoint = ({ text }) => (
  <View style={styles.bulletContainer}>
    <View style={styles.bullet} />
    <Text style={styles.bulletText}>{text}</Text>
  </View>
);

const StepItem = ({ number, title, description, isLast = false }) => (
  <View style={[styles.stepContainer, !isLast && styles.stepMargin]}>
    <LinearGradient
      colors={['#0d6efd', '#6610f2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.stepNumber}
    >
      <Text style={styles.stepNumberText}>{number}</Text>
    </LinearGradient>
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
  },
  card: {
    marginHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
    marginTop:15
  },
  header: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#0a58ca',
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#e3f2fd',
    fontWeight: '300',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionBar: {
    width: 4,
    height: 30,
    borderRadius: 10,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    flex: 1,
  },
  sectionContent: {
    paddingLeft: 16,
  },
  sectionText: {
    fontSize: 16,
    color: '#6c757d',
    lineHeight: 24,
  },
  subSection: {
    marginLeft: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 4,
    borderLeftColor: '#6c757d',
    borderRadius: 8,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  subSectionText: {
    fontSize: 15,
    color: '#6c757d',
    lineHeight: 22,
  },
  bulletContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  bullet: {
    width: 8,
    height: 8,
    backgroundColor: '#0d6efd',
    borderRadius: 4,
    marginTop: 8,
    marginRight: 12,
  },
  bulletText: {
    flex: 1,
    fontSize: 16,
    color: '#6c757d',
    lineHeight: 24,
  },
  claimBox: {
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#198754',
    borderRadius: 10,
  },
  freeplayBox: {
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
    borderRadius: 10,
  },
  freeplayText: {
    fontSize: 16,
    color: '#212529',
    lineHeight: 24,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepMargin: {
    marginBottom: 16,
  },
  stepNumber: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    marginTop: 2,
  },
  stepNumberText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  stepDescription: {
    fontSize: 15,
    color: '#6c757d',
    marginTop: 2,
  },
});

export default RulesAndRegulations;