import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Animated, Dimensions, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../../components/ScreenBackground';
import PremiumButton from '../../components/PremiumButton';
import { colors, radius, spacing, typography, shadow } from '../../theme/theme';

const { width } = Dimensions.get('window');

// Defined OUTSIDE the screen component so it never gets recreated on every
// re-render — keeping it inside caused React to remount the cards (briefly
// unmounting them) every time "selected" changed, which looked like the
// cards randomly disappearing for a moment.
function BoardCard({ label, icon, animatedX, isSelected, onPress }) {
  return (
    <Animated.View style={{ transform: [{ translateX: animatedX }], flex: 1 }}>
      <Pressable
        onPress={onPress}
        style={[styles.cardWrapper, isSelected && shadow.card]}
      >
        <LinearGradient
          colors={isSelected ? [colors.gradientStart, colors.gradientEnd] : [colors.surface, colors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, isSelected && styles.cardSelected]}
        >
          <Ionicons
            name={icon}
            size={28}
            color={isSelected ? colors.gold : colors.textSecondary}
            style={styles.cardIcon}
          />
          <Text style={[styles.cardText, isSelected && styles.cardTextSelected]}>
            {label}
          </Text>
          {isSelected && (
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={colors.gold}
              style={styles.checkIcon}
            />
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default function BoardSelectScreen({ navigation, route }) {
  const { classNumber } = route.params;
  const [selected, setSelected] = useState(null);

  // NCERT slides in from the left, CBSE slides in from the right
  const leftX = useRef(new Animated.Value(-width)).current;
  const rightX = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(leftX, { toValue: 0, friction: 8, useNativeDriver: true }),
      Animated.spring(rightX, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <ScreenBackground style={styles.container}>
      <Text style={styles.title}>Choose Your Board</Text>
      <Text style={styles.subtitle}>
        Class {classNumber} · AI will teach you based on this curriculum
      </Text>

      <View style={styles.row}>
        <BoardCard
          label="NCERT"
          icon="book-outline"
          animatedX={leftX}
          isSelected={selected === 'NCERT'}
          onPress={() => setSelected('NCERT')}
        />
        <View style={{ width: spacing.md }} />
        <BoardCard
          label="CBSE"
          icon="school-outline"
          animatedX={rightX}
          isSelected={selected === 'CBSE'}
          onPress={() => setSelected('CBSE')}
        />
      </View>

      <PremiumButton
        label="Continue"
        disabled={!selected}
        onPress={() =>
          navigation.navigate('NameEntry', { classNumber, board: selected })
        }
        style={styles.button}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: 100,
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
  },
  row: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  cardWrapper: {
    flex: 1,
    borderRadius: radius.lg,
  },
  card: {
    aspectRatio: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSelected: {
    borderColor: colors.gold,
    borderWidth: 2,
  },
  cardIcon: {
    marginBottom: spacing.sm,
  },
  cardText: {
    ...typography.h1,
    fontSize: 22,
    color: colors.textSecondary,
  },
  cardTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  checkIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  button: {
    marginTop: 'auto',
    marginBottom: spacing.lg,
  },
});
