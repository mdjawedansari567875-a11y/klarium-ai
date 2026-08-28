import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PremiumButton from './PremiumButton';
import { colors, radius, spacing, typography, shadow } from '../theme/theme';

// A simple step-by-step walkthrough shown once, the first time a user reaches
// Home, to teach them how to get the AI working — just like the "tap here"
// tutorials in other apps/games.
const STEPS = [
  {
    icon: 'sparkles',
    title: 'Welcome to KLARIUM AI!',
    description:
      "Before you can chat with your AI tutor, you need to connect a free API key. It only takes a minute — let's walk through it.",
    pointer: null,
  },
  {
    icon: 'settings-sharp',
    title: 'Step 1 — Open Settings',
    description: 'Tap the "Settings" tab in the bottom-right corner of the app.',
    pointer: 'bottom-right',
  },
  {
    icon: 'key',
    title: 'Step 2 — Find the API Key section',
    description: 'Inside Settings, look for the "Gemini API Key" card at the top of the screen.',
    pointer: null,
  },
  {
    icon: 'open-outline',
    title: 'Step 3 — Tap "GENERATE API KEY"',
    description:
      'This opens Google\u2019s website in your browser. Sign in with any Google account and copy the key it gives you — it\u2019s free.',
    pointer: null,
  },
  {
    icon: 'checkmark-circle',
    title: 'Step 4 — Paste it back here',
    description:
      'Return to KLARIUM AI, paste the key into the field, and tap "Save Key". You can now start chatting with your AI tutor!',
    pointer: null,
  },
];

export default function TutorialOverlay({ visible, onDone }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onDone();
      setStep(0);
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleSkip = () => {
    onDone();
    setStep(0);
  };

  if (!current) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {/* Pointer arrow toward the bottom-right Settings tab, only on step 2 */}
        {current.pointer === 'bottom-right' && (
          <View style={styles.pointerWrap} pointerEvents="none">
            <Ionicons name="arrow-down" size={36} color={colors.gold} />
          </View>
        )}

        <View style={[styles.card, shadow.card]}>
          <View style={styles.iconCircle}>
            <Ionicons name={current.icon} size={26} color={colors.gold} />
          </View>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.description}>{current.description}</Text>

          <View style={styles.dotsRow}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>

          <PremiumButton
            label={isLast ? "Got it, let's go!" : 'Next'}
            onPress={handleNext}
            style={{ marginTop: spacing.md }}
          />
          {!isLast && (
            <Pressable onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip tutorial</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  pointerWrap: {
    position: 'absolute',
    bottom: 150,
    right: 40,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(212,175,55,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body,
    lineHeight: 21,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.lg,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.gold,
    width: 18,
  },
  skipButton: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  skipText: {
    ...typography.caption,
    textDecorationLine: 'underline',
  },
});
