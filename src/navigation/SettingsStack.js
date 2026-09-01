import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from '../screens/main/SettingsScreen';
import ApiKeyScreen from '../screens/settings/ApiKeyScreen';
import DeveloperIdeaScreen from '../screens/settings/DeveloperIdeaScreen';
import LanguageScreen from '../screens/settings/LanguageScreen';
import PrivacyPolicyScreen from '../screens/settings/PrivacyPolicyScreen';
import TermsScreen from '../screens/settings/TermsScreen';

const Stack = createNativeStackNavigator();

export default function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsHome" component={SettingsScreen} />
      <Stack.Screen name="ApiKeyScreen" component={ApiKeyScreen} />
      <Stack.Screen name="DeveloperIdeaScreen" component={DeveloperIdeaScreen} />
      <Stack.Screen name="LanguageScreen" component={LanguageScreen} />
      <Stack.Screen name="PrivacyPolicyScreen" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsScreen" component={TermsScreen} />
    </Stack.Navigator>
  );
}
