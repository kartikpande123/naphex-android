import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const PrivacyPolicy = () => {
  return (
    <LinearGradient colors={['#f8f9ff', '#e6f3ff']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Card */}
        <View style={styles.card}>
          {/* Header */}
          <LinearGradient
            colors={['#0d6efd', '#6610f2']}
            style={styles.header}>
            <Text style={styles.headerTitle}>Privacy Policy</Text>
            <Text style={styles.headerSubtitle}>Your Privacy is Our Priority</Text>
          </LinearGradient>

          {/* Body */}
          <View style={styles.body}>
            <Text style={styles.updatedText}>Last Updated: 24.06.2025</Text>

            <Section title="1. Introduction">
              At Naphex, your privacy is our highest priority. This policy explains how we collect, use, store, and disclose your personal information. By using Naphex, you agree to the practices outlined here
            </Section>

            <Section title="2. Information We Collect">
              <Text style={styles.paragraph}>We collect information you provide directly, data from your activity on the platform, and information from third parties.</Text>
              <SubSection title="2.1 Personal Information You Provide">
                Name, email address, contact number, date of birth, and payment details.
              </SubSection>
              <SubSection title="2.2 Automatically Collected Data">
                IP address, session data, and pages visited.
              </SubSection>
              <SubSection title="2.3 Additional Verification Data">
                For high-value accounts or recovery: ID, proof of address, etc.
              </SubSection>
            </Section>

            <Section title="3. How We Use Your Information">
              {[
                'Account Management: To maintain your account and enable transactions.',
                'Personalization: To tailor the platform to your preferences.',
                'Legal Compliance: For AML and regulatory checks.',
                'Communication: To send updates, responses, and promotions.'
              ].map((item, idx) => (
                <Bullet key={idx} text={item} />
              ))}
            </Section>

            <Section title="4. Sharing Your Information">
              {[
                'Service Providers: For payments, fraud checks, support, and analytics.',
                'Legal Authorities: When required by law or legal processes.',
                'Business Transfers: If Naphex merges or is acquired, we\'ll notify you.'
              ].map((item, idx) => (
                <Bullet key={idx} text={item} />
              ))}
            </Section>

            <Section title="5. Cookies and Tracking Technologies">
              <Box gradient={['#fff3cd', '#ffeaa7']} borderColor="#ffc107">
                <SubSection title="5.1 Types of Cookies Used" backgroundColor="#ffffffb3">
                  {['Essential Cookies', 'Performance Cookies'].map((txt, i) => (
                    <Bullet key={i} text={txt} />
                  ))}
                </SubSection>
                <SubSection title="5.2 Managing Cookies" backgroundColor="#ffffffb3">
                  You can disable cookies through your browser settings, but it may impact functionality.
                </SubSection>
              </Box>
            </Section>

            <Section title="6. Protecting Your Information">
              <Box gradient={['#d1ecf1', '#bee5eb']} borderColor="#0dcaf0">
                <SubSection title="6.1 Security Measures" backgroundColor="#ffffffb3">
                  Encryption, secure storage, audits, and access control protect your data.
                </SubSection>
                <SubSection title="6.2 User Responsibility" backgroundColor="#ffffffb3">
                  Use strong passwords, don't share them, and report any suspicious activity.
                </SubSection>
              </Box>
            </Section>

            <Section title="7. Your Rights">
              <Box gradient={['#d1e7dd', '#a3d9a4']} borderColor="#198754">
                {[
                  'Access and Correction: Request or update your data.',
                  'Restriction: restrict processing.',
                  'Withdraw Consent: You may request revoke consent at any time.'
                ].map((item, idx) => (
                  <Bullet key={idx} text={item} />
                ))}
              </Box>
            </Section>

            <Section title="8. Third-Party Links">
              Naphex may link to external websites. We're not responsible for their privacy practices.
            </Section>

            <Section title="9. Children's Privacy">
              Naphex is for users 18+. If a child accesses our service, please report it.
            </Section>

            <Section title="10. Data Retention">
              We store your data only as long as necessary. You may request deletion after verifying your identity.
            </Section>

            <Section title="11. International Data Transfers">
              Your data may be stored abroad. We ensure compliance with relevant data protection laws.
            </Section>

            <Section title="12. Updates to This Privacy Policy">
              We update this policy periodically. Changes will be posted on our platform.
            </Section>

            <Section title="13. Contact Us">
              <Box gradient={['#f3e8ff', '#e9d5ff']} borderColor="#8b5cf6">
                <Text style={styles.contactText}>
                  <Text style={styles.bold}>Email:</Text> naphex.com@gmail.com{'\n'}
                  <Text style={styles.bold}>Phone:</Text> +91-7892739656
                </Text>
              </Box>
            </Section>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionTitleContainer}>
      <View style={styles.sectionBar} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.sectionContent}>
      {/* Wrap children safely inside Text */}
      {typeof children === 'string' ? (
        <Text style={styles.paragraph}>{children}</Text>
      ) : (
        children
      )}
    </View>
  </View>
);


const SubSection = ({ title, children, backgroundColor = '#f8f9fa' }) => (
  <View style={[styles.subSection, { backgroundColor }]}>
    <Text style={styles.subSectionTitle}>{title}</Text>
    {typeof children === 'string' ? (
      <Text style={styles.paragraph}>{children}</Text>
    ) : (
      children
    )}
  </View>
);


const Box = ({ children, gradient, borderColor }) => (
  <LinearGradient colors={gradient} style={[styles.boxContainer, { borderLeftColor: borderColor }]}>{children}</LinearGradient>
);

const Bullet = ({ text }) => (
  <View style={styles.bulletItem}>
    <View style={styles.bulletDot} />
    <Text style={styles.paragraph}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  card: {
    borderRadius: 20,
    backgroundColor: '#fff',
    overflow: 'hidden',
    elevation: 10,
    marginTop:15
  },
  header: {
    paddingVertical: 40,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#0a58ca',
  },
  headerTitle: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold'
  },
  headerSubtitle: {
    color: '#e3f2fd',
    marginTop: 5,
    fontSize: 16
  },
  body: {
    padding: 20
  },
  updatedText: {
    textAlign: 'right',
    fontStyle: 'italic',
    color: '#6c757d',
    marginBottom: 20
  },
  section: {
    marginBottom: 30
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  sectionBar: {
    width: 4,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#0d6efd',
    marginRight: 10
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000'
  },
  sectionContent: {
    paddingLeft: 10
  },
  subSection: {
    padding: 12,
    marginVertical: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#6c757d',
    borderRadius: 8
  },
  subSectionTitle: {
    fontWeight: '600',
    color: '#000',
    marginBottom: 4
  },
  paragraph: {
    color: '#444',
    lineHeight: 22
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 6
  },
  bulletDot: {
    width: 8,
    height: 8,
    backgroundColor: '#0d6efd',
    borderRadius: 4,
    marginTop: 6,
    marginRight: 10
  },
  boxContainer: {
    padding: 14,
    borderLeftWidth: 4,
    borderRadius: 10,
    marginVertical: 8
  },
  contactText: {
    fontSize: 16,
    color: '#333'
  },
  bold: {
    fontWeight: 'bold'
  }
});

export default PrivacyPolicy;
