import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import PremiumButton from './PremiumButton';
import { colors, radius, spacing, typography, shadow } from '../theme/theme';

// visible, questions: [{question, options, correctIndex}], onFinish(score, total)
export default function TestModal({ visible, questions, onFinish, loading }) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const current = questions?.[step];

  const handleAnswer = (index) => {
    setSelected(index);
    const isCorrect = index === current.correctIndex;
    const nextScore = isCorrect ? score + 1 : score;
    setScore(nextScore);

    setTimeout(() => {
      if (step + 1 < questions.length) {
        setStep(step + 1);
        setSelected(null);
      } else {
        setDone(true);
      }
    }, 500);
  };

  const handleClose = () => {
    onFinish(score, questions?.length || 0);
    setStep(0);
    setSelected(null);
    setScore(0);
    setDone(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, shadow.card]}>
          {loading ? (
            <>
              <ActivityIndicator color={colors.gold} size="large" />
              <Text style={[typography.body, { marginTop: spacing.md, textAlign: 'center' }]}>
                Preparing your weekly test...
              </Text>
            </>
          ) : done ? (
            <>
              <Text style={styles.badge}>🏆 7-Day Streak!</Text>
              <Text style={styles.title}>Test Complete</Text>
              <Text style={styles.scoreText}>
                {score} / {questions.length} correct
              </Text>
              <Text style={[typography.body, { textAlign: 'center', marginBottom: spacing.lg }]}>
                Your score has been added to the leaderboard.
              </Text>
              <PremiumButton label="Nice!" onPress={handleClose} />
            </>
          ) : current ? (
            <>
              <Text style={styles.badge}>🏆 7-Day Streak Test</Text>
              <Text style={styles.progress}>
                Question {step + 1} of {questions.length}
              </Text>
              <Text style={styles.question}>{current.question}</Text>
              {current.options.map((option, index) => {
                const isSelected = selected === index;
                const isCorrect = current.correctIndex === index;
                const showResult = selected !== null;
                return (
                  <Pressable
                    key={index}
                    onPress={() => selected === null && handleAnswer(index)}
                    style={[
                      styles.option,
                      showResult && isCorrect && styles.optionCorrect,
                      showResult && isSelected && !isCorrect && styles.optionWrong,
                    ]}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </Pressable>
                );
              })}
            </>
          ) : (
            <Text style={typography.body}>No questions available.</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    textAlign: 'center',
    color: colors.gold,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: spacing.xs,
  },
  progress: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  scoreText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.gold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  optionCorrect: {
    borderColor: colors.success,
    backgroundColor: 'rgba(62,207,142,0.12)',
  },
  optionWrong: {
    borderColor: colors.danger,
    backgroundColor: 'rgba(255,92,122,0.12)',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textPrimary,
  },
});
