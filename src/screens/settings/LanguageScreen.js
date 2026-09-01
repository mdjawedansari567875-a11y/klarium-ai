import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../../components/ScreenBackground';
import SubScreenHeader from '../../components/SubScreenHeader';
import { colors, radius, spacing, typography, shadow } from '../../theme/theme';
import { tapFeedback } from '../../utils/haptics';

const OPTIONS = [
  { code: 'en', label: 'English', hint: 'AI will reply in English' },
  { code: 'hi', label: 'हिंदी (Hindi)', hint: 'AI आपको हिंदी में जवाब देगा' },
];

export default function LanguageScreen({ navigation }) {
  const [selected, setSelected] = useState('en');

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('klarium_language');
      if (saved) setSelected(saved);
    })();
  }, []);

  const choose = async (code) => {
    tapFeedback();
    setSelected(code);
    await AsyncStorage.setItem('klarium_language', code);
  };

  return (
    <ScreenBackground>
      <SubScreenHeader title="Language" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <Text style={styles.hint}>
          Choose the language KLARIUM AI uses to explain topics to you.
        </Text>

        {OPTIONS.map((opt) => {
          const isSelected = selected === opt.code;
          return (
            <Pressable
              key={opt.code}
              style={[styles.card, shadow.card, isSelected && styles.cardSelected]}
              onPress={() => choose(opt.code)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{opt.label}</Text>
                <Text style={styles.subLabel}>{opt.hint}</Text>
              </View>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={24} color={colors.gold} />
              )}
            </Pressable>
          );
        })}
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  hint: {
    ...typography.body,
    marginBottom: spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardSelected: {
    borderColor: colors.gold,
    borderWidth: 2,
  },
  label: {
    ...typography.h2,
    fontSize: 17,
  },
  subLabel: {
    ...typography.caption,
    marginTop: 2,
  },
});
