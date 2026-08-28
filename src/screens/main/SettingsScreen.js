import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, Linking, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../../components/ScreenBackground';
import PremiumButton from '../../components/PremiumButton';
import { colors, radius, spacing, typography, shadow } from '../../theme/theme';
import { markApiKeySaved, getKeyTimeRemainingMs } from '../../services/geminiService';

const GEMINI_KEY_URL = 'https://aistudio.google.com/app/apikey';
const SUPPORT_EMAIL = 'amdjawed753@gmail.com';

function formatRemaining(ms) {
  if (ms <= 0) return null;
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m remaining`;
}

export default function SettingsScreen() {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('klarium_api_key');
      if (stored) setApiKey(stored);
      const remaining = await getKeyTimeRemainingMs();
      setRemainingMs(remaining);
    })();

    // Refresh the countdown every minute while this screen exists.
    intervalRef.current = setInterval(async () => {
      const remaining = await getKeyTimeRemainingMs();
      setRemainingMs(remaining);
    }, 60000);

    return () => clearInterval(intervalRef.current);
  }, []);

  const handleSaveKey = async () => {
    const trimmed = apiKey.trim();
    await AsyncStorage.setItem('klarium_api_key', trimmed);
    // Every time a key is (re)saved, the 24-hour window restarts from now.
    await markApiKeySaved();
    const remaining = await getKeyTimeRemainingMs();
    setRemainingMs(remaining);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const openGenerateKey = () => {
    WebBrowser.openBrowserAsync(GEMINI_KEY_URL);
  };

  const openSupportEmail = async () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=KLARIUM AI Support`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      Linking.openURL(url);
    } else {
      Alert.alert('Contact Support', SUPPORT_EMAIL);
    }
  };

  const remainingLabel = formatRemaining(remainingMs);

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={typography.h1}>Settings</Text>

        {/* API Key Section */}
        <View style={[styles.card, shadow.card]}>
          <Text style={styles.sectionTitle}>Gemini API Key</Text>
          <Text style={styles.sectionHint}>
            KLARIUM AI needs a Gemini API key to teach you. Generate a free one below,
            then paste it here.
          </Text>

          {apiKey.trim().length > 0 && (
            <View style={[styles.timerBadge, !remainingLabel && styles.timerBadgeExpired]}>
              <Ionicons
                name="time-outline"
                size={14}
                color={remainingLabel ? colors.gold : colors.danger}
              />
              <Text
                style={[
                  styles.timerText,
                  !remainingLabel && { color: colors.danger },
                ]}
              >
                {remainingLabel || 'Expired — regenerate and save your key again'}
              </Text>
            </View>
          )}

          <TextInput
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="Paste your API key here"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
          />
          <PremiumButton
            label={saved ? 'Saved ✓' : 'Save Key'}
            onPress={handleSaveKey}
            disabled={!apiKey.trim()}
            style={{ marginBottom: spacing.sm }}
          />
          <PremiumButton
            label="GENERATE API KEY"
            variant="outline"
            onPress={openGenerateKey}
          />
          <Text style={styles.expiryNote}>
            For security, each key stays active for 24 hours. After that, generate
            a new one (or re-save the same one) here to keep chatting with the AI.
          </Text>
        </View>

        {/* Developer & Idea */}
        <Pressable
          style={[styles.card, shadow.card, styles.rowCard]}
          onPress={() => setShowCredits((v) => !v)}
        >
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Developer & Idea</Text>
            <Ionicons
              name={showCredits ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textMuted}
            />
          </View>
          {showCredits && (
            <View style={{ marginTop: spacing.sm }}>
              <Text style={styles.creditLine}>DEVELOPED BY CARFAM (SABBIR)</Text>
              <Text style={styles.creditLine}>IDEA BY SONU</Text>
            </View>
          )}
        </Pressable>

        {/* Contact Support */}
        <Pressable style={[styles.card, shadow.card, styles.rowCard]} onPress={openSupportEmail}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Contact Support</Text>
            <Ionicons name="mail-outline" size={18} color={colors.gold} />
          </View>
          <Text style={styles.sectionHint}>{SUPPORT_EMAIL}</Text>
        </Pressable>
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
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  rowCard: {
    paddingVertical: spacing.md,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.h2,
  },
  sectionHint: {
    ...typography.body,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    marginBottom: spacing.md,
    gap: 6,
  },
  timerBadgeExpired: {
    backgroundColor: 'rgba(255,92,122,0.12)',
  },
  timerText: {
    ...typography.caption,
    color: colors.gold,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  expiryNote: {
    ...typography.caption,
    marginTop: spacing.md,
    lineHeight: 18,
  },
  creditLine: {
    ...typography.body,
    color: colors.gold,
    fontWeight: '600',
    marginBottom: 4,
  },
});
