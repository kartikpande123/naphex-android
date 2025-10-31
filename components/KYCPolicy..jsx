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

const KycPolicy = () => {
  return (
    <LinearGradient
      colors={['#f8f9ff', '#e6f3ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            {/* Enhanced Header */}
            <LinearGradient
              colors={['#0d6efd', '#6610f2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              <Text style={styles.headerTitle}>KYC Policy</Text>
              <Text style={styles.headerSubtitle}>at Naphex</Text>
            </LinearGradient>

            {/* Content */}
            <View style={styles.content}>
              <View style={styles.lastUpdated}>
                <Text style={styles.lastUpdatedText}>Last Updated: 24.06.2025</Text>
              </View>

              <Section title="Objective">
                <Text style={styles.sectionText}>
                  At Naphex, we care about the security of our user's data, user information, and transactions.
                  Our KYC policy helps verify user's identities to prevent fraud, identity theft, and financial crimes.
                  It supports compliance with national and international anti-money laundering (AML) and terrorism financing (TF) regulations.
                </Text>
              </Section>

              <Section title="Compliance with Regulatory Framework">
                <Text style={styles.sectionText}>
                  We comply with all applicable Indian laws and regulations, including the Information Technology Act, 2000, the Digital Personal Data Protection Act, 2023, and other relevant guidelines issued by Indian authorities, to ensure that Naphex remains a secure, legal, and trusted platform for all users.
                </Text>
              </Section>

              <Section title="Key Regulations">
                <BulletPoint>
                  <Text style={styles.boldText}>Prevention of Money Laundering Act, 2002 (PMLA): </Text>
                  <Text style={styles.sectionText}>Provides measures to prevent money laundering and combat financing of illegal activities.</Text>
                </BulletPoint>
                <BulletPoint>
                  <Text style={styles.boldText}>Reserve Bank of India (RBI) Guidelines: </Text>
                  <Text style={styles.sectionText}>Ensures safe and secure transfer of funds, including KYC and AML compliance requirements.</Text>
                </BulletPoint>
                <BulletPoint>
                  <Text style={styles.boldText}>Information Technology Act, 2000: </Text>
                  <Text style={styles.sectionText}>Governs electronic transactions, cybersecurity, and data protection obligations in India.</Text>
                </BulletPoint>
              </Section>

              <Section title="Money Laundering (ML) Definition">
                <BulletPoint>
                  <Text style={styles.sectionText}>Transferring or acquiring criminal property</Text>
                </BulletPoint>
                <BulletPoint>
                  <Text style={styles.sectionText}>Concealing or misrepresenting the source or ownership</Text>
                </BulletPoint>
                <BulletPoint>
                  <Text style={styles.sectionText}>Using criminally derived funds</Text>
                </BulletPoint>
                <BulletPoint>
                  <Text style={styles.sectionText}>Assisting or facilitating money laundering</Text>
                </BulletPoint>
              </Section>

              <Section title="AML Organization and Responsibilities">
                <BulletPoint>
                  <Text style={styles.boldText}>Senior Management: </Text>
                  <Text style={styles.sectionText}>Oversees effective AML enforcement</Text>
                </BulletPoint>
                <BulletPoint>
                  <Text style={styles.boldText}>AML Compliance Officer (AMLCO): </Text>
                  <Text style={styles.sectionText}>Implements policies and conducts audits</Text>
                </BulletPoint>
              </Section>

              <Section title="Verification Process">
                <LinearGradient
                  colors={['#d1e7dd', '#a3d9a4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.verificationBox}
                >
                  <View style={styles.verificationBorder} />
                  <StepItem number="1" title="Step 1 – Initial Assessment:" description="Full name, DOB, gender, country, full address" />
                  <StepItem number="2" title="Step 2 – Detailed Analysis:" description="ID proof(Adhar card, pan card, bank passbook), 6 digit otp" />
                </LinearGradient>
              </Section>

              <Section title="Customer Verification Process">
                <BulletPoint>
                  <Text style={styles.sectionText}>Submit valid ID (Adhar card, pan card, bank passbook)</Text>
                </BulletPoint>
                <BulletPoint>
                  <Text style={styles.sectionText}>Selfie with ID</Text>
                </BulletPoint>
                <BulletPoint>
                  <Text style={styles.sectionText}>6-digit code provided by Naphex</Text>
                </BulletPoint>
              </Section>

              <Section title="Address Verification">
                <Text style={styles.sectionText}>If automated address verification fails, you must upload:</Text>
                <View style={styles.marginTop}>
                  <BulletPoint>
                    <Text style={styles.sectionText}>Utility bill (electricity/gas/water)</Text>
                  </BulletPoint>
                  <BulletPoint>
                    <Text style={styles.sectionText}>Bank statement or government letter</Text>
                  </BulletPoint>
                </View>
              </Section>

              <Section title="Ongoing Monitoring & Compliance">
                <Text style={styles.sectionText}>
                  User activities are continuously monitored, and suspicious behavior is reported to the proper authorities.
                </Text>
              </Section>

              <Section title="Record Keeping and Data Security">
                <Text style={styles.sectionText}>
                  All data is stored securely and encrypted in accordance with data protection laws.
                </Text>
              </Section>

              <Section title="Staff Training & Internal Audits">
                <Text style={styles.sectionText}>
                  Our staff regularly undergo AML training and participate in internal policy audits.
                </Text>
              </Section>

              <Section title="Reporting Suspicious Activities">
                <Text style={styles.sectionText}>
                  All employees are trained to report unusual activity. Verified cases are forwarded to law enforcement when needed.
                </Text>
              </Section>

              <Section title="Contact Us">
                <LinearGradient
                  colors={['#f3e8ff', '#e9d5ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.contactBox}
                >
                  <View style={styles.contactBorder} />
                  <Text style={styles.darkText}>For any queries related to this policy:</Text>
                  <View style={styles.contactInfo}>
                    <Text style={styles.darkText}>
                      <Text style={styles.boldText}>Email:</Text> naphex24@outlook.com
                    </Text>
                    <Text style={styles.darkText}>
                      <Text style={styles.boldText}>Phone:</Text> +91-7892739656
                    </Text>
                  </View>
                </LinearGradient>
              </Section>
            </View>
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

const BulletPoint = ({ children }) => (
  <View style={styles.bulletPoint}>
    <View style={styles.customBullet} />
    <View style={styles.bulletContent}>{children}</View>
  </View>
);

const StepItem = ({ number, title, description, isLast }) => (
  <View style={[styles.stepItem, !isLast && styles.stepItemMargin]}>
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
    minHeight: '100%',
  },
  scrollContainer: {
    paddingVertical: 20,
  },
  cardContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  card: {
    width: width - 40,
    maxWidth: 800,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.1,
    shadowRadius: 40,
    elevation: 20,
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
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#e3f2fd',
    textAlign: 'center',
  },
  content: {
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
  },
  boldText: {
    fontWeight: 'bold',
    color: '#212529',
  },
  mutedText: {
    color: '#6c757d',
  },
  darkText: {
    color: '#212529',
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 12,
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
  verificationBox: {
    padding: 16,
    borderRadius: 10,
    position: 'relative',
  },
  verificationBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#198754',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  riskFrameworkBox: {
    padding: 16,
    borderRadius: 10,
    position: 'relative',
  },
  riskFrameworkBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#ffc107',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  contactBox: {
    padding: 16,
    borderRadius: 10,
    position: 'relative',
  },
  contactBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#8b5cf6',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  contactInfo: {
    marginTop: 12,
  },
  stepItem: {
    flexDirection: 'row',
  },
  stepItemMargin: {
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
    fontWeight: 'bold',
    color: '#212529',
    fontSize: 16,
  },
  stepDescription: {
    color: '#6c757d',
    fontSize: 14,
    marginTop: 2,
  },
  marginTop: {
    marginTop: 12,
  },
});

export default KycPolicy;