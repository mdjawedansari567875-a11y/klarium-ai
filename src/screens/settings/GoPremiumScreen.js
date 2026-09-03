import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../../components/ScreenBackground';
import { colors, radius, spacing, typography, shadow } from '../../theme/theme';
import { tapFeedback } from '../../utils/haptics';
import {
  getIsPremium,
  subscribeToPremiumStatus,
  purchasePremium,
  restorePremium,
  _devSetPremium,
} from '../../services/premiumService';

// Benefits shown on the paywall. Add more lines here as you decide what else
// premium unlocks besides removing ads.
const BENEFITS = [
  { icon: 'close-circle-outline', text: 'No ads, ever' },
  // { icon: 'time-outline', text: 'No 24-hour API key limit' },
];

export default function GoPremiumScreen() {
  const [isPremium, setIsPremium] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getIsPremium().then(setIsPremium);
    const unsubscribe = subscribeToPremiumStatus(setIsPremium);
    return unsubscribe;
  }, []);

  const handleUpgrade = async () => {
    tapFeedback();
    setBusy(true);
    try {
      await purchasePremium();
    } catch (e) {
      Alert.alert(
        'Coming Soon',
        'Paid subscriptions will be available once KLARIUM AI is live on the Play Store.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    tapFeedback();
    try {
      await restorePremium();
    } catch (e) {
      Alert.alert('Coming Soon', 'Restoring purchases will work once payments are live.');
    }
  };

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Ionicons name="sparkles" size={32} color={colors.gold} />
          <Text style={typography.h1}>Go Premium</Text>
          <Text style={styles.statusText}>
            {isPremium ? "You're a Premium member ✨" : "You're on the Free plan"}
          </Text>
        </View>

        <View style={[styles.card, shadow.card]}>
          {BENEFITS.map((b, i) => (
            <View key={i} style={styles.benefitRow}>
              <Ionicons name={b.icon} size={20} color={colors.gold} />
              <Text style={styles.benefitText}>{b.text}</Text>
            </View>
          ))}
        </View>

        {!isPremium && (
          <Pressable
            style={[styles.upgradeButton, shadow.glow]}
            onPress={handleUpgrade}
            disabled={busy}
          >
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </Pressable>
        )}

        <Pressable onPress={handleRestore}>
          <Text style={styles.restoreText}>Restore purchase</Text>
        </Pressable>

        {/* TESTING ONLY — lets you preview premium (ads hidden) before real
            payments exist. Remove this block before publishing to Play Store. */}
        <View style={styles.devBox}>
          <Text style={styles.devLabel}>Testing tool (remove before release)</Text>
          <Pressable
            style={styles.devButton}
            onPress={() => _devSetPremium(!isPremium)}
          >
            <Text style={styles.devButtonText}>
              {isPremium ? 'Turn Premium OFF (test)' : 'Turn Premium ON (test)'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  statusText: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  benefitText: {
    ...typography.h2,
    fontSize: 15,
  },
  upgradeButton: {
    width: '100%',
    backgroundColor: colors.gradientEnd,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  restoreText: {
    ...typography.caption,
    color: colors.gold,
    marginTop: spacing.md,
    textDecorationLine: 'underline',
  },
  devBox: {
    marginTop: spacing.xxl,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  devLabel: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  devButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  devButtonText: {
    color: colors.textPrimary,
    fontSize: 13,
  },
});
