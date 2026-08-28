import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Text } from 'react-native';
import ScreenBackground from '../../components/ScreenBackground';
import { colors, typography } from '../../theme/theme';

// First thing the user ever sees. Fades "WELCOME" in, holds ~1.2s,
// fades out, then moves to Class Selection automatically.
export default function WelcomeScreen({ navigation }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(900),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.replace('ClassSelect');
    });
  }, []);

  return (
    <ScreenBackground style={styles.center}>
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Text style={styles.welcome}>WELCOME</Text>
        <Text style={styles.brand}>KLARIUM AI</Text>
      </Animated.View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcome: {
    ...typography.displayHeavy,
    textAlign: 'center',
    letterSpacing: 6,
  },
  brand: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 4,
    color: colors.gold,
  },
});
