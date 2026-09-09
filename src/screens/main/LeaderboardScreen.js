import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../../components/ScreenBackground';
import { colors, radius, spacing, typography, shadow } from '../../theme/theme';
import { subscribeToLeaderboard } from '../../services/progressService';

// Live leaderboard — powered by Firestore. Every user's device is
// subscribed to the same "leaderboard" collection, so scores update
// here in real time for everyone, not just the device that took the test.
export default function LeaderboardScreen() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  // "all" or "premium" — controls which entries the FlatList shows below.
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard((data) => {
      setEntries(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const visibleEntries =
    activeTab === 'premium' ? entries.filter((e) => e.isPremium) : entries;

  const renderItem = ({ item, index }) => (
    <View style={[styles.row, shadow.card]}>
      <View style={[styles.rankCircle, index < 3 && styles.rankTop]}>
        <Text style={[styles.rankText, index < 3 && styles.rankTextTop]}>{index + 1}</Text>
      </View>
      {item.photoURL ? (
        <Image source={{ uri: item.photoURL }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarInitial}>{(item.name || '?').charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{item.name}</Text>
          {item.isPremium ? (
            <Image
              source={require('../../../assets/premium-medal.png')}
              style={styles.medalBadge}
            />
          ) : null}
        </View>
        <Text style={styles.date}>{item.date}</Text>
      </View>
      <Text style={styles.score}>
        {item.total ? `${item.score}/${item.total}` : item.score}
      </Text>
    </View>
  );

  return (
    <ScreenBackground style={styles.container}>
      <Text style={typography.h1}>Leaderboard</Text>
      <Text style={styles.subtitle}>Weekly test scores from every learner</Text>

      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            All
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, activeTab === 'premium' && styles.tabButtonActive]}
          onPress={() => setActiveTab('premium')}
        >
          <Image
            source={require('../../../assets/premium-medal.png')}
            style={styles.tabMedalIcon}
          />
          <Text style={[styles.tabText, activeTab === 'premium' && styles.tabTextActive]}>
            Premium Champions
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.gold} size="large" />
        </View>
      ) : visibleEntries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={typography.body}>
            {activeTab === 'premium'
              ? 'No premium champions yet.'
              : 'No scores yet. Complete a 7-day streak to take your first test!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibleEntries}
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
  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  tabButtonActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  tabMedalIcon: {
    width: 14,
    height: 14,
    marginRight: 4,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#0B0B14',
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
    marginRight: spacing.sm,
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
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    marginRight: spacing.md,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.gold,
    fontWeight: '700',
    fontSize: 15,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    ...typography.h2,
    fontSize: 16,
  },
  medalBadge: {
    width: 16,
    height: 16,
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
