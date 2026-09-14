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
import { markGroqKeySaved, getGroqKeyTimeRemainingMs } from '../../services/groqService';

const GEMINI_KEY_URL = 'https://aistudio.google.com/app/apikey';
const GROQ_KEY_URL = 'https://console.groq.com/keys';

function formatRemaining(ms) {
  if (ms <= 0) return null;
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m remaining`;
}

// One reusable card for a single provider's key — used twice below (Groq
// for chat, Gemini for photo/voice), so both keys look and behave the same.
function KeySection({
  label,
  hint,
  storageKey,
  generateUrl,
  onSaved,
  getTimeRemainingMs,
}) {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) setApiKey(stored);
      const remaining = await getTimeRemainingMs();
      setRemainingMs(remaining);
    })();

    intervalRef.current = setInterval(async () => {
      const remaining = await getTimeRemainingMs();
      setRemainingMs(remaining);
    }, 60000);

    return () => clearInterval(intervalRef.current);
  }, []);

  const handleSaveKey = async () => {
    const trimmed = apiKey.trim();
    await AsyncStorage.setItem(storageKey, trimmed);
    await onSaved();
    const remaining = await getTimeRemainingMs();
    setRemainingMs(remaining);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const openGenerateKey = () => {
    WebBrowser.openBrowserAsync(generateUrl);
  };

  const remainingLabel = formatRemaining(remainingMs);

  return (
    <>
      <Text style={styles.sectionLabel}>{label}</Text>
      <Text style={styles.sectionHint}>{hint}</Text>

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
    </>
  );
}

export default function ApiKeyScreen({ navigation }) {
  return (
    <ScreenBackground>
      <SubScreenHeader title="API Keys" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.iconCircle}>
          <Ionicons name="key" size={30} color={colors.gold} />
        </View>

        <Text style={styles.heading}>Connect Your AI Keys</Text>
        <Text style={styles.hint}>
          KLARIUM AI uses two free keys: Groq powers your text chat (it resets
          every minute, so it rarely runs out), and Gemini handles photo
          questions and voice notes.
        </Text>

        <KeySection
          label="Groq Key (Chat)"
          hint="Used for regular text questions and quizzes."
          storageKey="klarium_groq_api_key"
          generateUrl={GROQ_KEY_URL}
          onSaved={markGroqKeySaved}
          getTimeRemainingMs={getGroqKeyTimeRemainingMs}
        />

        <View style={styles.divider} />

        <KeySection
          label="Gemini Key (Photo & Voice)"
          hint="Used when you send a photo of a question or use the mic."
          storageKey="klarium_api_key"
          generateUrl={GEMINI_KEY_URL}
          onSaved={markApiKeySaved}
          getTimeRemainingMs={getKeyTimeRemainingMs}
        />

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
  sectionLabel: {
    ...typography.h2,
    fontSize: 16,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  sectionHint: {
    ...typography.caption,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
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
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xl,
  },
  expiryNote: {
    ...typography.caption,
    marginTop: spacing.lg,
    lineHeight: 18,
    textAlign: 'center',
  },
});
