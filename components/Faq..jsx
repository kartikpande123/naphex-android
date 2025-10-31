import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const ResponsibleGaming = () => {
  const [activeAccordion, setActiveAccordion] = useState("0");

  const toggleAccordion = (eventKey) => {
    setActiveAccordion(activeAccordion === eventKey ? "" : eventKey);
  };

  const handleEmailPress = () => {
    Linking.openURL('mailto:naphex.com@gmail.com');
  };

  const handlePhonePress = () => {
    Linking.openURL('tel:+917892739656');
  };

  const handleLinkPress = (url) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={['#1e3c72', '#2a5298']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Responsible Gaming</Text>
        <Text style={styles.headerSubtitle}>Your safety and well-being are our priority</Text>
        <Text style={styles.headerDate}>Last updated: 14.06.2025</Text>
      </LinearGradient>

      <View style={styles.contentContainer}>
        <View style={styles.card}>
          {/* FAQs Section */}
          <View style={styles.faqSection}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            
            <View style={styles.accordionContainer}>
              {faqData.map((faq, index) => (
                <View key={index} style={styles.accordionItem}>
                  <TouchableOpacity
                    style={[
                      styles.accordionButton,
                      activeAccordion === index.toString() && styles.accordionButtonActive
                    ]}
                    onPress={() => toggleAccordion(index.toString())}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.accordionButtonText,
                      activeAccordion === index.toString() && styles.accordionButtonTextActive
                    ]}>
                      {faq.question}
                    </Text>
                    <Text style={[
                      styles.accordionArrow,
                      { transform: [{ rotate: activeAccordion === index.toString() ? '180deg' : '0deg' }] }
                    ]}>
                      ▼
                    </Text>
                  </TouchableOpacity>
                  {activeAccordion === index.toString() && (
                    <View style={styles.accordionContent}>
                      {typeof faq.answer === 'string' ? (
                        <Text style={styles.accordionContentText}>{faq.answer}</Text>
                      ) : (
                        faq.answer
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Main Content Sections */}
          <View style={styles.mainContent}>
            {sections.map((section, idx) => (
              <View key={idx} style={styles.section}>
                <Text style={styles.sectionTitleMain}>{section.title}</Text>
                <View style={styles.sectionContent}>
                  {typeof section.content === 'string' ? (
                    <Text style={styles.sectionText}>{section.content}</Text>
                  ) : (
                    section.content
                  )}
                </View>
              </View>
            ))}

            {/* Support Section */}
            <LinearGradient
              colors={['#e8f5e8', '#f0f8ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.supportSection}
            >
              <Text style={styles.supportTitle}>Support and Assistance from Naphex</Text>
              <Text style={styles.supportSubtitle}>For help or guidance, reach out to us:</Text>
              
              <View style={styles.contactContainer}>
                <View style={styles.contactItem}>
                  <View style={[styles.contactIcon, { backgroundColor: '#4caf50' }]}>
                    <Text style={styles.contactIconText}>✉</Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactLabel}>Email: </Text>
                    <TouchableOpacity onPress={handleEmailPress}>
                      <Text style={styles.contactLink}>naphex24@outlook.com</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.contactItem}>
                  <View style={[styles.contactIcon, { backgroundColor: '#2196f3' }]}>
                    <Text style={styles.contactIconText}>☎</Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactLabel}>Phone: </Text>
                    <TouchableOpacity onPress={handlePhonePress}>
                      <Text style={styles.contactLink}>+91-7892739656</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </LinearGradient>

            {/* Conclusion */}
            <LinearGradient
              colors={['#1e3c72', '#2a5298']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.conclusion}
            >
              <Text style={styles.conclusionTitle}>Our Commitment</Text>
              <Text style={styles.conclusionText}>
                Responsible gaming keeps the experience enjoyable and safe. Naphex is committed to ensuring that you play responsibly.
              </Text>
            </LinearGradient>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const faqData = [
  {
    question: "What is responsible gaming?",
    answer: "It's the practice of keeping gaming under control to ensure it remains fun and risk-free."
  },
  {
    question: "What tools does Naphex provide for responsible gaming?",
    answer: "Naphex offers self-assessment tools, spending trackers, and request for deactivation of account options through support channels."
  },
  {
    question: "How can I self-exclude from Naphex?",
    answer: "Contact Naphex customer support."
  },
  {
    question: "How does Naphex protect minors?",
    answer: "With strict age verification and support for parental filtering software."
  },
  {
    question: "How do I reach Naphex support?",
    answer: (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <Text style={{ color: '#555', fontSize: 14, lineHeight: 22 }}>Email us at </Text>
        <TouchableOpacity onPress={() => Linking.openURL('mailto:naphex.com@gmail.com')}>
          <Text style={{ color: '#1565c0', fontSize: 14, textDecorationLine: 'underline' }}>
            naphex.com@gmail.com
          </Text>
        </TouchableOpacity>
        <Text style={{ color: '#555', fontSize: 14, lineHeight: 22 }}> or call </Text>
        <TouchableOpacity onPress={() => Linking.openURL('tel:+917892739656')}>
          <Text style={{ color: '#1565c0', fontSize: 14, textDecorationLine: 'underline' }}>
            +91-7892739656
          </Text>
        </TouchableOpacity>
        <Text style={{ color: '#555', fontSize: 14, lineHeight: 22 }}>.</Text>
      </View>
    )
  }
];

const sections = [
  {
    title: "Responsible Gaming at Naphex",
    content: "Responsible gaming means enjoying games within healthy limits while avoiding potential risks of problem gaming. At Naphex, we prioritize user safety and integrity, creating a space where fun stays safe."
  },
  {
    title: "What is Responsible Gaming?",
    content: "It's the conscious decision to game for fun without letting it impact your financial, mental, or relationship security."
  },
  {
    title: "Why is Responsible Gaming Important?",
    content: "Irresponsible gaming can lead to financial stress, addiction, and personal conflict. With control, the joy of gaming can be preserved."
  },
  {
    title: "Elements of Responsible Gaming",
    content: "Setting limits, taking breaks, and using awareness tools are key components of responsible gaming behavior."
  },
  {
    title: "Naphex's Commitment to Responsible Gaming",
    content: "We offer a secure and transparent environment that supports healthy gaming practices."
  },
  {
    title: "Advanced Tools for Player Safety",
    content: "Naphex uses tech-based solutions like spending trackers and personalized reports to help players stay informed and in control."
  },
  {
    title: "Self-Assessment for Players",
    content: (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <Text style={{ color: '#555', fontSize: 14, lineHeight: 24 }}>Use the </Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://www.begambleaware.org')}>
          <Text style={{ color: '#1565c0', fontSize: 14, textDecorationLine: 'underline' }}>
            BeGambleAware self-test
          </Text>
        </TouchableOpacity>
        <Text style={{ color: '#555', fontSize: 14, lineHeight: 24 }}> to evaluate your gaming habits and identify early signs of concern.</Text>
      </View>
    )
  },
  {
    title: "Knowing When to Take a Break",
    content: "Breaks improve clarity and reduce risk. Naphex recommends regular time-outs from gaming activities."
  },
  {
    title: "Protection of Minors from Gambling",
    content: "Naphex uses a strict age verification system to prevent minors from accessing gambling services."
  },
  {
    title: "Parental Controls and Monitoring",
    content: "Parents are encouraged to use tools like Net Nanny to restrict access and monitor device usage for minors."
  },
  {
    title: "Keeping Credentials Private",
    content: "Ensure that login details are confidential and secure, especially in shared or family devices."
  },
  {
    title: "Commitment to Self-Exclusion",
    content: "Users may voluntarily exclude themselves for periods (6 months to 5 years), during which account creation is disabled."
  },
  {
    title: "Self-Exclusion Support",
    content: "Naphex's support team is ready to assist in setting up or managing self-exclusion."
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  headerSubtitle: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    opacity: 0.9,
  },
  headerDate: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
    overflow: 'hidden',
  },
  faqSection: {
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1565c0',
    textAlign: 'center',
    marginBottom: 20,
  },
  accordionContainer: {
    marginTop: 10,
  },
  accordionItem: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  accordionButton: {
    backgroundColor: 'white',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  accordionButtonActive: {
    backgroundColor: '#e3f2fd',
  },
  accordionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  accordionButtonTextActive: {
    color: '#1565c0',
  },
  accordionArrow: {
    fontSize: 20,
    color: '#666',
  },
  accordionContent: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  accordionContentText: {
    color: '#555',
    fontSize: 14,
    lineHeight: 22,
  },
  mainContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionTitleMain: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1565c0',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
  },
  sectionContent: {
    marginTop: 5,
  },
  sectionText: {
    color: '#555',
    fontSize: 14,
    lineHeight: 24,
  },
  supportSection: {
    borderWidth: 1,
    borderColor: '#4caf50',
    borderLeftWidth: 5,
    borderRadius: 10,
    padding: 25,
    marginBottom: 20,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 12,
  },
  supportSubtitle: {
    color: '#555',
    fontSize: 14,
    marginBottom: 15,
  },
  contactContainer: {
    marginTop: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactIconText: {
    color: 'white',
    fontSize: 18,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  contactLabel: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 14,
  },
  contactLink: {
    color: '#1565c0',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  conclusion: {
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
  },
  conclusionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  conclusionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ResponsibleGaming;