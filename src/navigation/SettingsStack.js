import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from '../screens/main/SettingsScreen';
import ApiKeyScreen from '../screens/settings/ApiKeyScreen';
import DeveloperIdeaScreen from '../screens/settings/DeveloperIdeaScreen';

const Stack = createNativeStackNavigator();

export default function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsHome" component={SettingsScreen} />
      <Stack.Screen name="ApiKeyScreen" component={ApiKeyScreen} />
      <Stack.Screen name="DeveloperIdeaScreen" component={DeveloperIdeaScreen} />
    </Stack.Navigator>
  );
}
