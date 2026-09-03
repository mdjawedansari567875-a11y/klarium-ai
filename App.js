import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from '@expo-google-fonts/poppins';
import OnboardingNavigator from './src/navigation/OnboardingNavigator';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import ScreenBackground from './src/components/ScreenBackground';
import { colors } from './src/theme/theme';
import { ensureSignedIn } from './src/services/authService';
import { setupStreakReminder } from './src/services/notificationService';
import { initAds } from './src/services/adsService';

const RootStack = createNativeStackNavigator();

export default function App() {
  const [checking, setChecking] = useState(true);
  const [onboarded, setOnboarded] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  useEffect(() => {
    // Initialize the ads SDK as soon as the app starts, so the banner ad on
    // the Home screen is ready to load the first time a non-premium user
    // opens it (rather than waiting until that screen mounts).
    initAds();

    (async () => {
      // Sign the device in anonymously with Firebase first — this gives every
      // user a stable, unique ID that the leaderboard is keyed on. It happens
      // silently in the background; the user never sees a login screen.
      try {
        await ensureSignedIn();
      } catch (e) {
        // If this fails (e.g. no internet on first launch), the app still
        // works locally — the leaderboard just won't sync until it succeeds.
        console.warn('Firebase sign-in failed:', e.message);
      }

      // Local daily reminder so students don't lose their streak. Free,
      // no backend required.
      setupStreakReminder().catch(() => {});

      const flag = await AsyncStorage.getItem('klarium_onboarded');
      setOnboarded(flag === 'true');
      setChecking(false);
    })();
  }, []);

  if (checking || !fontsLoaded) {
    return (
      <ScreenBackground style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.gold} size="large" />
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
