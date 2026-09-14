import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import ClassSelectScreen from '../screens/onboarding/ClassSelectScreen';
import BoardSelectScreen from '../screens/onboarding/BoardSelectScreen';
import NameEntryScreen from '../screens/onboarding/NameEntryScreen';
import PrivacyPolicyScreen from '../screens/settings/PrivacyPolicyScreen';
import TermsScreen from '../screens/settings/TermsScreen';

const Stack = createNativeStackNavigator();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="ClassSelect" component={ClassSelectScreen} />
      <Stack.Screen name="BoardSelect" component={BoardSelectScreen} />
      <Stack.Screen name="NameEntry" component={NameEntryScreen} />
      <Stack.Screen name="PrivacyPolicyScreen" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsScreen" component={TermsScreen} />
    </Stack.Navigator>
  );
}
