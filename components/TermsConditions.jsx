import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const TermsAndConditions = () => {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#f8f9ff', '#e6f3ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
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
              <Text style={styles.headerTitle}>Terms & Conditions</Text>
              <Text style={styles.headerSubtitle}>Please Read These Terms Carefully</Text>
            </LinearGradient>

            {/* Content */}
            <View style={styles.cardBody}>
              <View style={styles.lastUpdated}>
                <Text style={styles.lastUpdatedText}>Last Updated: 14.06.2025</Text>
              </View>

              <Section title="Welcome to Naphex!">
                <LinearGradient
                  colors={['#fff3cd', '#ffeaa7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.welcomeBox}
                >
                  <Text style={styles.welcomeText}>
                    You agree to follow all the terms and conditions listed here if you use services or features of the website. This operating procedure and policies are designed to ensure a friendly and safe online environment for all participants, so it is important that you carefully review it before using the website. If there is something you do not agree with, please refrain from stepping on it.
                  </Text>
                </LinearGradient>
              </Section>

              <Section title="1. Overview">
                <Text style={styles.sectionText}>
                  Naphex is a platform meant for online gaming and sports gaming. In order to get the most of this site, you must be a registered member and adhere to these Terms of Agreement.
                </Text>
                <SubSection subtitle="1.1 Agreement Acceptance">
                  <Text style={styles.subSectionText}>
                    Your usage of Naphex affirms your acceptance of these Terms.
                  </Text>
                </SubSection>
                <SubSection subtitle="1.2 Terms Updates">
                  <Text style={styles.subSectionText}>
                    We can update these Terms of Service on occasion, and such modifications will be communicated through our website. However, it is advised to check this page regularly to be updated with modified terms and conditions.
                  </Text>
                </SubSection>
              </Section>

              <Section title="2. Account Management and Security">
                <LinearGradient
                  colors={['#d1ecf1', '#bee5eb']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.securityBox}
                >
                  <SubSection subtitle="2.1 Account Creation" isNested={true}>
                    <Text style={styles.subSectionText}>
                      To begin the use of Naphex, you need to create an account. You must offer correct and clear information at the time of registration. Please make certain that the information you provide is updated so that we can offer the best possible service.
                    </Text>
                  </SubSection>
                  <SubSection subtitle="2.2 Security Responsibility" isNested={true}>
                    <Text style={styles.subSectionText}>
                      You are expected to take responsibility for maintaining the integrity of your login credentials. If you feel any unauthorized login or activities in your account, let us know via our support channels and help sections.
                    </Text>
                  </SubSection>
                  <SubSection subtitle="2.3 Age Requirement" isNested={true}>
                    <Text style={styles.subSectionText}>
                      You must be at least 18 years of age or the lawful age in your jurisdiction.
                    </Text>
                  </SubSection>
                </LinearGradient>
              </Section>

              <Section title="3. Financial Transactions">
                <BulletPoint title="Deposits:">
                  After creating your profile, you are asked to deposit money to play the games.
                </BulletPoint>
                <BulletPoint title="Banking Options:">
                  Naphex offers multiple banking options for your convenience.
                </BulletPoint>
                <BulletPoint title="Withdrawals:">
                  Withdrawals may take time based on the method and requires verification, based on the payment method you adapt tax will be deducted.
                </BulletPoint>
                <BulletPoint title="Payment Details:">
                  Double-check all payment details as they cannot be reversed.
                </BulletPoint>
              </Section>

              <Section title="4. Promotions and Bonuses">
                <BulletPoint title="Bonus Offers:">
                  Naphex offers promotions and bonuses to enhance your experience.
                </BulletPoint>
                <BulletPoint title="Specific Terms:">
                  Every promotion has specific terms, such as wagering requirements or minimum deposits.
                </BulletPoint>
                <BulletPoint title="Bonus Forfeiture:">
                  Failure to meet these terms may void the bonus and related winnings.
                </BulletPoint>
              </Section>

              <Section title="5. Responsible Gaming">
                <LinearGradient
                  colors={['#d1e7dd', '#a3d9a4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.responsibleBox}
                >
                  <SubSection subtitle="5.1 Gaming Tools" isNested={true}>
                    <Text style={styles.subSectionText}>
                      We offer tools like Account overview, request for deactivation of the account via our support channel and reminders to help you manage your gaming experience.
                    </Text>
                  </SubSection>
                  <SubSection subtitle="5.2 Support Resources" isNested={true}>
                    <Text style={styles.subSectionText}>
                      If your gaming becomes problematic, please reach out to our support team or seek professional help.
                    </Text>
                  </SubSection>
                </LinearGradient>
              </Section>

              <Section title="6. Gaming Rules">
                <BulletPoint title="Game Policies:">
                  Each game or comes with specific rules. Read all game policies before placing bets.
                </BulletPoint>
                <BulletPoint title="Bet Finality:">
                  Game cannot be reversed once placed.
                </BulletPoint>
                <BulletPoint title="Event Cancellation:">
                  If an event is canceled, we may refund or adjust bets accordingly.
                </BulletPoint>
              </Section>

              <Section title="7. Prohibited Conduct">
                <LinearGradient
                  colors={['#f8d7da', '#f1aeb5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.prohibitedBox}
                >
                  <BulletPoint title="Fraud and Cheating:" isProhibited={true}>
                    Strictly prohibited and will result in account suspension.
                  </BulletPoint>
                  <BulletPoint title="Multiple Accounts:" isProhibited={true}>
                    Using multiple accounts to exploit rewards is not allowed.
                  </BulletPoint>
                  <BulletPoint title="Personal Involvement:" isProhibited={true}>
                    You cannot wager on events in which you are personally involved.
                  </BulletPoint>
                </LinearGradient>
              </Section>

              <Section title="8. Account Termination and Suspension">
                <SubSection subtitle="8.1 Platform Rights">
                  <Text style={styles.subSectionText}>
                    We reserve the right to suspend or terminate accounts that violate terms.
                  </Text>
                </SubSection>
                <SubSection subtitle="8.2 Voluntary Closure">
                  <Text style={styles.subSectionText}>
                    You may also request voluntary closure through support.
                  </Text>
                </SubSection>
                <SubSection subtitle="8.3 Refund Policy">
                  <Text style={styles.subSectionText}>
                    Refunds will be subject to withdrawal conditions and verification processes.
                  </Text>
                </SubSection>
              </Section>

              <Section title="9. Privacy and Data Protection">
                <Text style={styles.sectionText}>
                  Your data is protected and collected for service delivery. See our Privacy Policy for details. By using Naphex, you agree to these practices.
                </Text>
              </Section>

              <Section title="10. Liability Disclaimer">
                <Text style={styles.sectionText}>
                  Naphex is not liable for technical issues, data loss, or problems from third-party providers.
                </Text>
              </Section>

              <Section title="11. Dispute Resolution">
                <Text style={styles.sectionText}>
                  Contact support for disputes. If unresolved, legal steps may be taken under applicable jurisdiction laws.
                </Text>
              </Section>

              <Section title="12. Governing Law">
                <Text style={styles.sectionText}>
                  These terms follow the laws of the jurisdiction where Naphex operates.
                </Text>
              </Section>

              <Section title="13. Modifications to These Terms">
                <Text style={styles.sectionText}>
                  We may update these terms anytime. Continued use of the platform indicates acceptance of updated terms.
                </Text>
              </Section>

              <Section title="14. Contact Information">
                <LinearGradient
                  colors={['#f3e8ff', '#e9d5ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.contactBox}
                >
                  <Text style={styles.contactText}>
                    Reach us with any questions about your account or these terms.{'\n\n'}
                    <Text style={styles.contactBold}>Email:</Text> naphex24@outlook.com{'\n'}
                    <Text style={styles.contactBold}>Phone:</Text> +91-7892739656
                  </Text>
                </LinearGradient>
              </Section>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
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

const SubSection = ({ subtitle, children, isNested = false }) => (
  <View style={[styles.subSection, isNested && styles.nestedSubSection]}>
    <Text style={styles.subSectionTitle}>{subtitle}</Text>
    {children}
  </View>
);

const BulletPoint = ({ title, children, isProhibited = false }) => (
  <View style={styles.bulletPoint}>
    <View style={styles.customBullet} />
    <View style={styles.bulletContent}>
      <Text style={[styles.bulletTitle, isProhibited && styles.prohibitedTitle]}>
        {title}
      </Text>
      <Text style={[styles.bulletText, isProhibited && styles.prohibitedText]}>
        {children}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#e3f2fd',
    textAlign: 'center',
  },
  cardBody: {
    padding: 20,
  },
  lastUpdated: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 20,
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
    marginBottom: 12,
  },
  subSection: {
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 4,
    borderLeftColor: '#6c757d',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  nestedSubSection: {
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  subSectionText: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  customBullet: {
    width: 8,
    height: 8,
    backgroundColor: '#0d6efd',
    borderRadius: 4,
    marginTop: 8,
    marginRight: 12,
  },
  bulletContent: {
    flex: 1,
  },
  bulletTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  bulletText: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  prohibitedTitle: {
    color: '#212529',
  },
  prohibitedText: {
    color: '#6c757d',
  },
  welcomeBox: {
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    borderRadius: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: '#212529',
    lineHeight: 24,
  },
  securityBox: {
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0dcaf0',
    borderRadius: 10,
  },
  responsibleBox: {
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#198754',
    borderRadius: 10,
  },
  prohibitedBox: {
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
    borderRadius: 10,
  },
  contactBox: {
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
    borderRadius: 10,
  },
  contactText: {
    fontSize: 16,
    color: '#212529',
    lineHeight: 24,
  },
  contactBold: {
    fontWeight: 'bold',
  },
});

export default TermsAndConditions;