import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../../components/ScreenBackground';
import SubScreenHeader from '../../components/SubScreenHeader';
import { colors, radius, spacing, typography, shadow } from '../../theme/theme';

export default function DeveloperIdeaScreen({ navigation }) {
  return (
    <ScreenBackground>
      <SubScreenHeader title="Developer & Idea" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Ionicons name="sparkles" size={30} color={colors.gold} />
        </View>

        <Text style={styles.appName}>KLARIUM AI</Text>
        <Text style={styles.tagline}>Your Personal AI Tutor</Text>

        <View style={[styles.card, shadow.card]}>
          <View style={styles.row}>
            <Text style={styles.label}>DEVELOPED BY</Text>
            <Text style={styles.value}>CARFAM (SABBIR)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>IDEA BY</Text>
            <Text style={styles.value}>SONU</Text>
          </View>
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(212,175,55,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    ...typography.displayHeavy,
    fontSize: 24,
    letterSpacing: 2,
    textAlign: 'center',
  },
  tagline: {
    ...typography.caption,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  row: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  label: {
    ...typography.caption,
    marginBottom: 6,
  },
  value: {
    ...typography.h2,
    color: colors.gold,
    letterSpacing: 0.5,
  },
});
