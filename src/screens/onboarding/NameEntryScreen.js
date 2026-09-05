import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { statusCodes } from '@react-native-google-signin/google-signin';
import ScreenBackground from '../../components/ScreenBackground';
import PremiumButton from '../../components/PremiumButton';
import { colors, radius, spacing, typography } from '../../theme/theme';
import { signInWithGoogle, getCurrentUid } from '../../services/authService';
import { ensureUserRecord, updateUserProfile } from '../../services/userService';

export default function NameEntryScreen({ navigation, route }) {
  const { classNumber, board } = route.params;
  const [name, setName] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  const handleContinue = async () => {
    if (signingIn) return;
    setSigningIn(true);
    try {
      // Opens the native Google account picker. The Firebase account that
      // was already silently created (anonymous sign-in) gets upgraded to
      // this Google identity — same uid carries over everywhere.
      const googleUser = await signInWithGoogle();
      const uid = getCurrentUid();

      // Store the real Gmail + Google name in Firestore for the future
      // admin panel only — never shown anywhere in the app's UI.
      await ensureUserRecord(uid, {
        email: googleUser.email,
        googleName: googleUser.displayName,
        photoURL: googleUser.photoURL,
      });

      // Store the typed username (this is what's shown publicly, e.g. leaderboard).
      await updateUserProfile(uid, {
        username: name.trim(),
        classNumber,
        board,
      });

      // Keep a local copy too, so Home/Settings can read it instantly
      // without hitting Firestore every time.
      const profile = {
        name: name.trim(),
        classNumber,
        board,
        photoURL: googleUser.photoURL || null,
      };
      await AsyncStorage.setItem('klarium_profile', JSON.stringify(profile));
      await AsyncStorage.setItem('klarium_onboarded', 'true');
      navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
    } catch (e) {
      if (e.code !== statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert(
          'Sign-in failed',
          'Something went wrong signing in with Google. Please check your internet connection and try again.'
        );
      }
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenBackground style={styles.container}>
        <Text style={styles.title}>What should we call you?</Text>
        <Text style={styles.subtitle}>
          Class {classNumber} · {board}
        </Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          autoFocus
        />

        <PremiumButton
          label={signingIn ? 'Signing in...' : 'Continue with Google'}
          disabled={name.trim().length === 0 || signingIn}
          onPress={handleContinue}
          style={styles.button}
        />
      </ScreenBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: 120,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
    color: colors.gold,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
    color: colors.textPrimary,
    fontSize: 17,
  },
  button: {
    marginTop: spacing.xl,
  },
});
