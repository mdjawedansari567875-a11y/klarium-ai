import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import ScreenBackground from '../../components/ScreenBackground';
import SubScreenHeader from '../../components/SubScreenHeader';
import { colors, spacing, typography } from '../../theme/theme';

export default function PrivacyPolicyScreen({ navigation }) {
  return (
    <ScreenBackground>
      <SubScreenHeader title="Privacy Policy" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.updated}>Last updated: 2026</Text>

        <Text style={styles.heading}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          KLARIUM AI collects your name, selected class, and board (NCERT/CBSE) to
          personalize your learning experience. Your device is also assigned a random,
          anonymous ID (via Firebase Authentication) to keep track of your leaderboard
          scores — this does not identify you personally.
        </Text>

        <Text style={styles.heading}>2. How We Use Third-Party Services</Text>
        <Text style={styles.paragraph}>
          • Google Gemini API: your questions (text, photos, or voice recordings) are
          sent to Google's Gemini AI to generate an educational answer. Google's own
          privacy policy applies to this processing.{'\n\n'}
          • Firebase (Google): used to store your leaderboard score and anonymous
          account ID.
        </Text>

        <Text style={styles.heading}>3. Data Stored On Your Device</Text>
        <Text style={styles.paragraph}>
          Your chat history, class/board selection, and app preferences are stored
          locally on your device and are not shared with anyone except as described
          above.
        </Text>

        <Text style={styles.heading}>4. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          KLARIUM AI is designed for school students. We do not knowingly collect more
          personal information than necessary (name, class, board) and do not use data
          for personalized advertising targeted at children.
        </Text>

        <Text style={styles.heading}>5. Your Choices</Text>
        <Text style={styles.paragraph}>
          You can clear your chat history or change your API key at any time from
          Settings. To request deletion of your data, contact us using the email
          below.
        </Text>

        <Text style={styles.heading}>6. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have questions about this policy, email klariumai@gmail.com.
        </Text>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  updated: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  heading: {
    ...typography.h2,
    fontSize: 16,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    color: colors.gold,
  },
  paragraph: {
    ...typography.body,
    lineHeight: 21,
  },
});
