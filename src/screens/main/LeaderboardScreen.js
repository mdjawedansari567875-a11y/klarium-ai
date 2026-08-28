import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import ScreenBackground from '../../components/ScreenBackground';
import { colors, radius, spacing, typography, shadow } from '../../theme/theme';
import { subscribeToLeaderboard } from '../../services/progressService';

// Live leaderboard — powered by Firestore. Every user's device is
// subscribed to the same "leaderboard" collection, so scores update
// here in real time for everyone, not just the device that took the test.
export default function LeaderboardScreen() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard((data) => {
      setEntries(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const renderItem = ({ item, index }) => (
    <View style={[styles.row, shadow.card]}>
      <View style={[styles.rankCircle, index < 3 && styles.rankTop]}>
        <Text style={[styles.rankText, index < 3 && styles.rankTextTop]}>{index + 1}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>
      <Text style={styles.score}>
        {item.score}/{item.total}
      </Text>
    </View>
  );

  return (
    <ScreenBackground style={styles.container}>
      <Text style={typography.h1}>Leaderboard</Text>
      <Text style={styles.subtitle}>Weekly test scores from every learner</Text>

      {loading ? (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.gold} size="large" />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={typography.body}>
            No scores yet. Complete a 7-day streak to take your first test!
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item, i) => item.name + i}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: spacing.lg, paddingBottom: spacing.xl }}
        />
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  subtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  empty: {
    marginTop: spacing.xxl,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rankCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rankTop: {
    backgroundColor: colors.gold,
  },
  rankText: {
    color: colors.textSecondary,
    fontWeight: '700',
  },
  rankTextTop: {
    color: '#0B0B14',
  },
  name: {
    ...typography.h2,
    fontSize: 16,
  },
  date: {
    ...typography.caption,
    marginTop: 2,
  },
  score: {
    ...typography.h2,
    color: colors.gold,
  },
});
