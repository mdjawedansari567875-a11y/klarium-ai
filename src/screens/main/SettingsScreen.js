import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../../components/ScreenBackground';
import { colors, radius, spacing, typography, shadow } from '../../theme/theme';
import { tapFeedback } from '../../utils/haptics';
import { getIsPremium, subscribeToPremiumStatus } from '../../services/premiumService';

const SUPPORT_EMAIL = 'klariumai@gmail.com';

export default function SettingsScreen({ navigation }) {
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    getIsPremium().then(setIsPremium);
    const unsubscribe = subscribeToPremiumStatus(setIsPremium);
    return unsubscribe;
  }, []);

  const openSupportEmail = () => {
    tapFeedback();
    const url = `mailto:${SUPPORT_EMAIL}?subject=KLARIUM AI Support`;
    // Skip the canOpenURL check — on some Android versions it incorrectly
    // reports mail apps as unavailable even when Gmail is installed.
    Linking.openURL(url).catch(() => {
      Alert.alert('Contact Support', SUPPORT_EMAIL);
    });
  };

  const go = (screen) => {
    tapFeedback();
    navigation.navigate(screen);
  };

  const MenuRow = ({ icon, title, subtitle, onPress, highlighted }) => (
    <Pressable
      style={[styles.row, shadow.card, highlighted && styles.rowHighlighted]}
      onPress={onPress}
    >
      <View style={[styles.rowIconCircle, highlighted && styles.rowIconCircleHighlighted]}>
        <Ionicons name={icon} size={20} color={highlighted ? colors.background : colors.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, highlighted && styles.rowTitleHighlighted]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.rowSubtitle, highlighted && styles.rowSubtitleHighlighted]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={highlighted ? colors.background : colors.textMuted}
      />
    </Pressable>
  );

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={typography.h1}>Settings</Text>

        <MenuRow
          icon="sparkles"
          title={isPremium ? 'Premium Member' : 'Go Premium'}
          subtitle={isPremium ? 'Thank you for supporting KLARIUM AI' : 'Remove ads and more'}
          onPress={() => go('GoPremiumScreen')}
          highlighted={!isPremium}
        />

        <MenuRow
          icon="key"
          title="Gemini API Key"
          subtitle="Connect or update your AI key"
          onPress={() => go('ApiKeyScreen')}
        />

        <MenuRow
          icon="sparkles"
          title="Developer & Idea"
          subtitle="About this app"
          onPress={() => go('DeveloperIdeaScreen')}
        />

        <MenuRow
          icon="shield-checkmark-outline"
          title="Privacy Policy"
          onPress={() => go('PrivacyPolicyScreen')}
        />

        <MenuRow
          icon="document-text-outline"
          title="Terms of Service"
          onPress={() => go('TermsScreen')}
        />

        <MenuRow
          icon="mail-outline"
          title="Contact Support"
          subtitle={SUPPORT_EMAIL}
          onPress={openSupportEmail}
        />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  rowHighlighted: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  rowIconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowIconCircleHighlighted: {
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  rowTitle: {
    ...typography.h2,
    fontSize: 16,
  },
  rowTitleHighlighted: {
    color: colors.background,
  },
  rowSubtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  rowSubtitleHighlighted: {
    color: colors.background,
    opacity: 0.75,
  },
});
