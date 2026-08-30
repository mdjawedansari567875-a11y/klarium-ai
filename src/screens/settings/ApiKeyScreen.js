import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../../components/ScreenBackground';
import SubScreenHeader from '../../components/SubScreenHeader';
import PremiumButton from '../../components/PremiumButton';
import { colors, radius, spacing, typography, shadow } from '../../theme/theme';
import { markApiKeySaved, getKeyTimeRemainingMs } from '../../services/geminiService';

const GEMINI_KEY_URL = 'https://aistudio.google.com/app/apikey';

function formatRemaining(ms) {
  if (ms <= 0) return null;
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m remaining`;
}

export default function ApiKeyScreen({ navigation }) {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('klarium_api_key');
      if (stored) setApiKey(stored);
      const remaining = await getKeyTimeRemainingMs();
      setRemainingMs(remaining);
    })();

    intervalRef.current = setInterval(async () => {
      const remaining = await getKeyTimeRemainingMs();
      setRemainingMs(remaining);
    }, 60000);

    return () => clearInterval(intervalRef.current);
  }, []);

  const handleSaveKey = async () => {
    const trimmed = apiKey.trim();
    await AsyncStorage.setItem('klarium_api_key', trimmed);
    await markApiKeySaved();
    const remaining = await getKeyTimeRemainingMs();
    setRemainingMs(remaining);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const openGenerateKey = () => {
    WebBrowser.openBrowserAsync(GEMINI_KEY_URL);
  };

  const remainingLabel = formatRemaining(remainingMs);

  return (
    <ScreenBackground>
      <SubScreenHeader title="Gemini API Key" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.iconCircle}>
          <Ionicons name="key" size={30} color={colors.gold} />
        </View>

        <Text style={styles.heading}>Connect Your AI Key</Text>
        <Text style={styles.hint}>
          KLARIUM AI needs a free Gemini API key to teach you. Generate one below,
          then paste it in the field to start chatting.
        </Text>

        {apiKey.trim().length > 0 && (
          <View style={[styles.timerBadge, !remainingLabel && styles.timerBadgeExpired]}>
            <Ionicons
              name="time-outline"
              size={14}
              color={remainingLabel ? colors.gold : colors.danger}
            />
            <Text style={[styles.timerText, !remainingLabel && { color: colors.danger }]}>
              {remainingLabel || 'Expired — regenerate and save your key again'}
            </Text>
          </View>
        )}

        <View style={[styles.card, shadow.card]}>
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
          <PremiumButton label="GENERATE API KEY" variant="outline" onPress={openGenerateKey} />
        </View>

        <Text style={styles.expiryNote}>
          For security, each key stays active for 24 hours. After that, generate
          a new one (or re-save the same one) here to keep chatting with the AI.
        </Text>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(212,175,55,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  heading: {
    ...typography.h1,
    fontSize: 22,
    textAlign: 'center',
  },
  hint: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
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
  card: {
    width: '100%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
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
    marginTop: spacing.lg,
    lineHeight: 18,
    textAlign: 'center',
  },
});
