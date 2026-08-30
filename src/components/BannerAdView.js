import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { colors, spacing } from '../theme/theme';

// Real Android banner ad unit (from AdMob). iOS still uses Google's test ID
// until you create an iOS app + ad unit in AdMob — swap it in the same way
// once you do.
const AD_UNIT_ID = Platform.select({
  android: 'ca-app-pub-4588188976164551/7783764395',
  ios: TestIds.BANNER,
  default: TestIds.BANNER,
});

export default function BannerAdView() {
  return (
    <View style={styles.wrapper}>
      <BannerAd
        unitId={AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    backgroundColor: colors.backgroundAlt,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
