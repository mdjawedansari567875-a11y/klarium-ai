import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from '@expo-google-fonts/poppins';
import OnboardingNavigator from './src/navigation/OnboardingNavigator';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import ScreenBackground from './src/components/ScreenBackground';
import { colors, typography, spacing } from './src/theme/theme';
import { ensureSignedIn, getCurrentUid } from './src/services/authService';
import { setupStreakReminder } from './src/services/notificationService';
import { initAds } from './src/services/adsService';
import { getUserRecord } from './src/services/userService';
import { syncPremiumFromServer } from './src/services/premiumService';
import { registerForPushNotifications } from './src/services/pushTokenService';

const RootStack = createNativeStackNavigator();

export default function App() {
  const [checking, setChecking] = useState(true);
  const [onboarded, setOnboarded] = useState(false);
  const [banned, setBanned] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  useEffect(() => {
    initAds();

    (async () => {
      let uid = null;

      try {
        await ensureSignedIn();
        uid = getCurrentUid();
      } catch (e) {
        console.warn('Firebase sign-in failed:', e.message);
      }

      try {
        const record = await getUserRecord(uid);
        if (record?.banned) {
          setBanned(true);
          setChecking(false);
          return;
        }
        await syncPremiumFromServer(record?.isPremium);
      } catch (e) {
        console.warn('User record check failed:', e.message);
      }

      setupStreakReminder().catch(() => {});

      const flag = await AsyncStorage.getItem('klarium_onboarded');
      setOnboarded(flag === 'true');
      setChecking(false);

      // Registers this device for push notifications in the background —
      // any failure here is logged to the console only and never shown to
      // the student, since it's not something they can act on directly.
      if (uid) {
        setTimeout(() => {
          registerForPushNotifications(uid).catch((e) => {
            console.warn('Push registration failed:', e.message);
          });
        }, 1500);
      }
    })();
  }, []);

  if (checking || !fontsLoaded) {
    return (
      <ScreenBackground style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.gold} size="large" />
      </ScreenBackground>
    );
  }

  if (banned) {
    return (
      <ScreenBackground style={styles.bannedContainer}>
        <Text style={styles.bannedTitle}>Account Blocked</Text>
        <Text style={styles.bannedText}>
          Your access to KLARIUM AI has been blocked. If you think this is a mistake,
          please contact klariumai@gmail.com.
        </Text>
      </ScreenBackground>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!onboarded && (
          <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
        )}
        <RootStack.Screen name="MainApp" component={MainTabNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  bannedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  bannedTitle: {
    ...typography.h1,
    color: colors.danger,
    marginBottom: spacing.md,
  },
  bannedText: {
    ...typography.body,
    textAlign: 'center',
  },
});
