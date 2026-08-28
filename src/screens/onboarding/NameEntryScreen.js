import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenBackground from '../../components/ScreenBackground';
import PremiumButton from '../../components/PremiumButton';
import { colors, radius, spacing, typography } from '../../theme/theme';

export default function NameEntryScreen({ navigation, route }) {
  const { classNumber, board } = route.params;
  const [name, setName] = useState('');

  const handleContinue = async () => {
    // Save the user's profile locally (and later, sync to Firebase Auth/Firestore
    // once the backend is wired in) so the app opens straight to Home next time.
    const profile = { name: name.trim(), classNumber, board };
    await AsyncStorage.setItem('klarium_profile', JSON.stringify(profile));
    await AsyncStorage.setItem('klarium_onboarded', 'true');
    navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
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
          label="Start Learning"
          disabled={name.trim().length === 0}
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
