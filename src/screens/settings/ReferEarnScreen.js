import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Share, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenBackground from '../../components/ScreenBackground';
import SubScreenHeader from '../../components/SubScreenHeader';
import PremiumButton from '../../components/PremiumButton';
import { colors, radius, spacing, typography, shadow } from '../../theme/theme';
import { getCurrentUid } from '../../services/authService';
import { ensureReferralCode } from '../../services/userService';

export default function ReferEarnScreen({ navigation }) {
  const [code, setCode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const uid = getCurrentUid();
      const savedProfile = JSON.parse((await AsyncStorage.getItem('klarium_profile')) || '{}');
      const generated = await ensureReferralCode(uid, savedProfile.name);
      setCode(generated);
      setLoading(false);
    })();
  }, []);

  const handleShare = () => {
    Share.share({
      message: `Join me on KLARIUM AI! 🌟 Use my referral code ${code} when you sign up and we BOTH get 3 days of Premium free!`,
    });
  };

  return (
    <ScreenBackground>
      <SubScreenHeader title="Refer & Earn" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Ionicons name="gift" size={30} color={colors.gold} />
        </View>

        <Text style={styles.heading}>Give 3 Days, Get 3 Days</Text>
        <Text style={styles.hint}>
          Share your code with a friend. When they enter it while signing up,
          you BOTH get 3 days of Premium — free!
        </Text>

        <View style={[styles.codeCard, shadow.card]}>
          {loading ? (
            <ActivityIndicator color={colors.gold} />
          ) : (
            <Text style={styles.code}>{code}</Text>
          )}
        </View>

        <PremiumButton
          label="Share Your Code"
          onPress={handleShare}
          disabled={loading}
          style={styles.button}
        />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(212,175,55,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heading: {
    ...typography.h1,
    fontSize: 22,
    textAlign: 'center',
  },
  hint: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  codeCard: {
    width: '100%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  code: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 4,
    color: colors.gold,
  },
  button: {
    width: '100%',
  },
});
