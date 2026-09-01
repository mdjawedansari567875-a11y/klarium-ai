import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../../components/ScreenBackground';
import { colors, radius, spacing, typography, shadow } from '../../theme/theme';
import { tapFeedback } from '../../utils/haptics';

const SUPPORT_EMAIL = 'klariumai@gmail.com';

export default function SettingsScreen({ navigation }) {
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

  const MenuRow = ({ icon, title, subtitle, onPress }) => (
    <Pressable style={[styles.row, shadow.card]} onPress={onPress}>
      <View style={styles.rowIconCircle}>
        <Ionicons name={icon} size={20} color={colors.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={typography.h1}>Settings</Text>

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
  rowIconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowTitle: {
    ...typography.h2,
    fontSize: 16,
  },
  rowSubtitle: {
    ...typography.caption,
    marginTop: 2,
  },
});
