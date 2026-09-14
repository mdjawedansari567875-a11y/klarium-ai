import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import HomeScreen from '../screens/main/HomeScreen';
import LeaderboardScreen from '../screens/main/LeaderboardScreen';
import SettingsStack from './SettingsStack';
import { colors } from '../theme/theme';

const Tab = createBottomTabNavigator();

const ICONS = {
  Home: 'home',
  Leaderboard: 'trophy',
  Settings: 'settings-sharp',
};

// Frosted "Liquid Glass" background behind the tab bar. NOTE: tabBarStyle is
// NOT position:'absolute' here — that would require every screen (chat input,
// lists) to add extra bottom padding to avoid being hidden behind the bar,
// which caused the chat input to get covered. Kept in normal flow instead,
// so nothing else needs to change; the blur still gives a frosted-glass look.
function TabBarBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.tint} />
    </View>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopColor: 'rgba(212,175,55,0.2)',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarBackground: () => <TabBarBackground />,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name]} color={color} size={size - 4} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,11,20,0.35)',
  },
});
