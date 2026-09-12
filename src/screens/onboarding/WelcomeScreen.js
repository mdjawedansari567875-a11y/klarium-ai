import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Text, Image, Easing } from 'react-native';
import ScreenBackground from '../../components/ScreenBackground';
import { colors, typography } from '../../theme/theme';

// First thing the user ever sees. Fades in the app logo + "WELCOME" text
// with a soft gold glow ring pulsing behind it, holds briefly, fades out,
// then moves to Class Selection automatically.
export default function WelcomeScreen({ navigation }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const ringScale = useRef(new Animated.Value(0.6)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Gold ring gently pulses behind the text, looping while the screen holds.
    const ringLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ringScale, {
            toValue: 1.3,
            duration: 1400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 1400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(ringScale, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
      ])
    );
    ringLoop.start();

    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1400),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start(() => {
      ringLoop.stop();
      navigation.replace('ClassSelect');
    });
  }, []);

  return (
    <ScreenBackground style={styles.center}>
      <Animated.View
        style={[
          styles.ring,
          { opacity: ringOpacity, transform: [{ scale: ringScale }] },
        ]}
      />
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        <Image
          source={require('../../../assets/klarium-icon.png')}
          style={styles.logo}
        />
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
  content: {
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: colors.gold,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 20,
    marginBottom: 18,
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
