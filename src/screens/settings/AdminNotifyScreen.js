import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../../services/firebaseConfig';
import ScreenBackground from '../../components/ScreenBackground';
import SubScreenHeader from '../../components/SubScreenHeader';
import PremiumButton from '../../components/PremiumButton';
import { colors, radius, spacing, typography, shadow } from '../../theme/theme';

// Only these Google accounts may use this screen. This is a UX gate —
// the real security is Firestore rules, which restrict who can read the
// `users` collection's push tokens the same way.
const ADMIN_EMAILS = [
  'mdjawedansari567875@gmail.com',
  'amdjawed753@gmail.com',
  'mdfaizanansarim32@gmail.com',
];

export default function AdminNotifyScreen({ navigation }) {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const email = auth.currentUser?.email || '';
    setIsAdmin(ADMIN_EMAILS.includes(email));
    setChecking(false);
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !desc.trim()) {
      setStatus('Please fill both Title and Description.');
      return;
    }
    setSending(true);
    setStatus('Fetching student devices...');

    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const tokens = snapshot.docs
        .map((d) => d.data().expoPushToken)
        .filter((t) => typeof t === 'string' && t.startsWith('ExponentPushToken'));

      if (tokens.length === 0) {
        setStatus('No students have notifications enabled yet.');
        setSending(false);
        return;
      }

      setStatus(`Sending to ${tokens.length} student(s)...`);

      const chunks = [];
      for (let i = 0; i < tokens.length; i += 100) {
        chunks.push(tokens.slice(i, i + 100));
      }

      let sentCount = 0;
      let lastError = '';

      for (const chunk of chunks) {
        const messages = chunk.map((token) => ({
          to: token,
          title: title.trim(),
          body: desc.trim(),
          sound: 'default',
        }));
        try {
          const res = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messages),
          });
          if (res.ok) {
            sentCount += chunk.length;
          } else {
            lastError = `HTTP ${res.status}`;
          }
        } catch (e) {
          lastError = e.message || String(e);
        }
      }

      if (sentCount > 0 && !lastError) {
        setStatus(`Sent to ${sentCount} student(s) ✓`);
        setTitle('');
        setDesc('');
      } else if (sentCount > 0) {
        setStatus(`Sent to ${sentCount}, some failed: ${lastError}`);
      } else {
        setStatus(`Failed: ${lastError}`);
      }
    } catch (e) {
      setStatus('Error: ' + (e.message || String(e)));
    } finally {
      setSending(false);
    }
  };

  if (checking) {
    return (
      <ScreenBackground style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <ActivityIndicator color={colors.gold} size="large" />
      </ScreenBackground>
    );
  }

  if (!isAdmin) {
    return (
      <ScreenBackground>
        <SubScreenHeader title="Access Denied" onBack={() => navigation.goBack()} />
        <View style={styles.deniedContainer}>
          <Text style={styles.deniedText}>
            This screen is only available to the KLARIUM AI admin accounts.
          </Text>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <SubScreenHeader title="Send Notification" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.card, shadow.card]}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
          <TextInput
            value={desc}
            onChangeText={setDesc}
            placeholder="Description"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.textArea]}
            multiline
          />
          <PremiumButton
            label={sending ? 'Sending...' : 'Send to All Students'}
            onPress={handleSend}
            disabled={sending || !title.trim() || !desc.trim()}
          />
          {status ? <Text style={styles.status}>{status}</Text> : null}
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
  },
  card: {
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
    paddingVertical: 12,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  status: {
    ...typography.caption,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  deniedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  deniedText: {
    ...typography.body,
    textAlign: 'center',
  },
});
