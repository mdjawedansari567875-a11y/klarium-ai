import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Animated, Dimensions, Pressable } from 'react-native';
import ScreenBackground from '../../components/ScreenBackground';
import PremiumButton from '../../components/PremiumButton';
import { colors, radius, spacing, typography, shadow } from '../../theme/theme';

const { width } = Dimensions.get('window');

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

  const BoardCard = ({ label, animatedX }) => {
    const isSelected = selected === label;
    return (
      <Animated.View style={{ transform: [{ translateX: animatedX }], flex: 1 }}>
        <Pressable
          onPress={() => setSelected(label)}
          style={[styles.card, isSelected && styles.cardSelected, shadow.card]}
        >
          <Text style={[styles.cardText, isSelected && styles.cardTextSelected]}>
            {label}
          </Text>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <ScreenBackground style={styles.container}>
      <Text style={styles.title}>Choose Your Board</Text>
      <Text style={styles.subtitle}>
        Class {classNumber} · AI will teach you based on this curriculum
      </Text>

      <View style={styles.row}>
        <BoardCard label="NCERT" animatedX={leftX} />
        <View style={{ width: spacing.md }} />
        <BoardCard label="CBSE" animatedX={rightX} />
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
  card: {
    aspectRatio: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSelected: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.gold,
    borderWidth: 2,
  },
  cardText: {
    ...typography.h1,
    fontSize: 22,
    color: colors.textSecondary,
  },
  cardTextSelected: {
    color: colors.gold,
  },
  button: {
    marginTop: 'auto',
    marginBottom: spacing.lg,
  },
});
