import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { statusCodes } from '@react-native-google-signin/google-signin';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../../components/ScreenBackground';
import PremiumButton from '../../components/PremiumButton';
import { colors, radius, spacing, typography, shadow } from '../../theme/theme';
import { signInWithGoogle, getCurrentUid } from '../../services/authService';
import { ensureUserRecord, updateUserProfile } from '../../services/userService';

export default function NameEntryScreen({ navigation, route }) {
  const { classNumber, board } = route.params;
  const [name, setName] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [focused, setFocused] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const canContinue =
    name.trim().length > 0 && acceptedPrivacy && acceptedTerms && !signingIn;

  const handleContinue = async () => {
    if (signingIn || !canContinue) return;
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

  const Checkbox = ({ checked, onToggle, children }) => (
    <Pressable style={styles.checkboxRow} onPress={onToggle}>
      <View style={[styles.checkboxBox, checked && styles.checkboxBoxChecked]}>
        {checked && <Ionicons name="checkmark" size={14} color="#0B0B14" />}
      </View>
      <Text style={styles.checkboxLabel}>{children}</Text>
    </Pressable>
  );

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

        <View style={[styles.inputWrapper, shadow.card, focused && styles.inputWrapperFocused]}>
          <Ionicons
            name="person-circle-outline"
            size={20}
            color={focused ? colors.gold : colors.textMuted}
            style={styles.inputIcon}
          />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoFocus
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </View>

        <View style={styles.checkboxGroup}>
          <Checkbox checked={acceptedPrivacy} onToggle={() => setAcceptedPrivacy((v) => !v)}>
            I accept your Privacy Policy
          </Checkbox>
          <Checkbox checked={acceptedTerms} onToggle={() => setAcceptedTerms((v) => !v)}>
            I accept your Terms
          </Checkbox>
        </View>

        <PremiumButton
          label={signingIn ? 'Signing in...' : 'Continue with Google'}
          disabled={!canContinue}
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  inputWrapperFocused: {
    borderColor: colors.gold,
    borderWidth: 1.5,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    color: colors.textPrimary,
    fontSize: 17,
  },
  checkboxGroup: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  checkboxBoxChecked: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  checkboxLabel: {
    ...typography.body,
    fontSize: 14,
  },
  button: {
    marginTop: spacing.xl,
  },
});
