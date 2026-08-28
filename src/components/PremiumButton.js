import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, typography, shadow } from '../theme/theme';

// A single consistent "premium" call-to-action button.
// variant: 'gradient' (default, filled violet->blue) or 'outline' (gold border, transparent)
export default function PremiumButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'gradient',
  style,
}) {
  if (variant === 'outline') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.outline,
          pressed && { opacity: 0.7 },
          disabled && styles.disabled,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.gold} />
        ) : (
          <Text style={styles.outlineLabel}>{label}</Text>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [pressed && { opacity: 0.85 }, style]}
    >
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, shadow.card, disabled && styles.disabled]}
      >
        {loading ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : (
          <Text style={styles.label}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gradient: {
    paddingVertical: 16,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.h2,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  outline: {
    borderWidth: 1.5,
    borderColor: colors.gold,
    paddingVertical: 16,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  outlineLabel: {
    ...typography.h2,
    color: colors.gold,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.4,
  },
});
