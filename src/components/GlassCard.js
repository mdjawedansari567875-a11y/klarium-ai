import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { radius, colors } from '../theme/theme';

// Reusable "Liquid Glass" surface — a frosted, translucent card with a soft
// highlight border, used everywhere a solid card previously appeared
// (Settings rows, chat header, modals, etc.) for a consistent premium look
// across the whole app.
export default function GlassCard({ children, style, intensity = 40, radiusSize = radius.lg }) {
  return (
    <View style={[styles.wrapper, { borderRadius: radiusSize }, style]}>
      <BlurView
        intensity={intensity}
        tint="dark"
        style={[StyleSheet.absoluteFill, { borderRadius: radiusSize }]}
      />
      <View style={[styles.tintOverlay, { borderRadius: radiusSize }]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
  },
  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(23,23,36,0.45)',
  },
  content: {
    position: 'relative',
  },
});
