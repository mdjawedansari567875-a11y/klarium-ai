import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme/theme';

// Every screen in the app should be wrapped in this so the premium
// dark background + status bar styling stays identical everywhere.
export default function ScreenBackground({ children, style }) {
  return (
    <View style={[styles.base, style]}>
      <StatusBar style="light" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
