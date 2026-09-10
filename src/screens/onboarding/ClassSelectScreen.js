import React, { useRef } from 'react';
import { StyleSheet, Text, FlatList, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../../components/ScreenBackground';
import PremiumButton from '../../components/PremiumButton';
import { colors, radius, spacing, typography, shadow } from '../../theme/theme';

const CLASSES = Array.from({ length: 12 }, (_, i) => i + 1);

export default function ClassSelectScreen({ navigation }) {
  const [selected, setSelected] = React.useState(null);
  const scaleValues = useRef(CLASSES.map(() => new Animated.Value(1))).current;

  const animatePress = (index) => {
    Animated.sequence([
      Animated.spring(scaleValues[index], { toValue: 0.9, useNativeDriver: true, speed: 40 }),
      Animated.spring(scaleValues[index], { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
  };

  return (
    <ScreenBackground style={styles.container}>
      <Text style={styles.title}>Select Your Class</Text>
      <Text style={styles.subtitle}>Choose the class you're currently studying in</Text>

      <FlatList
        data={CLASSES}
        keyExtractor={(item) => String(item)}
        numColumns={4}
        contentContainerStyle={styles.grid}
        renderItem={({ item, index }) => {
          const isSelected = selected === item;
          return (
            <Animated.View style={{ flex: 1, transform: [{ scale: scaleValues[index] }] }}>
              <Pressable
                onPress={() => {
                  setSelected(item);
                  animatePress(index);
                }}
                style={[styles.tileWrapper, isSelected && shadow.card]}
              >
                <LinearGradient
                  colors={isSelected ? [colors.gradientStart, colors.gradientEnd] : [colors.surface, colors.surface]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.tile, isSelected && styles.tileSelected]}
                >
                  <Text style={[styles.tileText, isSelected && styles.tileTextSelected]}>
                    {item}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={colors.gold}
                      style={styles.checkIcon}
                    />
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>
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
  tileWrapper: {
    flex: 1,
    margin: spacing.xs,
    borderRadius: radius.md,
  },
  tile: {
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileSelected: {
    borderColor: colors.gold,
    borderWidth: 1.5,
  },
  tileText: {
    ...typography.h2,
    color: colors.textSecondary,
  },
  tileTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  checkIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  button: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
});
