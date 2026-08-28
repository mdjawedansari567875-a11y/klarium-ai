import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable } from 'react-native';
import ScreenBackground from '../../components/ScreenBackground';
import PremiumButton from '../../components/PremiumButton';
import { colors, radius, spacing, typography, shadow } from '../../theme/theme';

const CLASSES = Array.from({ length: 12 }, (_, i) => i + 1);

export default function ClassSelectScreen({ navigation }) {
  const [selected, setSelected] = useState(null);

  return (
    <ScreenBackground style={styles.container}>
      <Text style={styles.title}>Select Your Class</Text>
      <Text style={styles.subtitle}>Choose the class you're currently studying in</Text>

      <FlatList
        data={CLASSES}
        keyExtractor={(item) => String(item)}
        numColumns={4}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => {
          const isSelected = selected === item;
          return (
            <Pressable
              onPress={() => setSelected(item)}
              style={[
                styles.tile,
                isSelected && styles.tileSelected,
                shadow.card,
              ]}
            >
              <Text style={[styles.tileText, isSelected && styles.tileTextSelected]}>
                {item}
              </Text>
            </Pressable>
          );
        }}
      />

      <PremiumButton
        label="Continue"
        disabled={!selected}
        onPress={() => navigation.navigate('BoardSelect', { classNumber: selected })}
        style={styles.button}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  grid: {
    gap: spacing.md,
  },
  tile: {
    flex: 1,
    aspectRatio: 1,
    margin: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileSelected: {
    backgroundColor: colors.gradientStart,
    borderColor: colors.gold,
  },
  tileText: {
    ...typography.h2,
    color: colors.textSecondary,
  },
  tileTextSelected: {
    color: '#FFFFFF',
  },
  button: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
});
