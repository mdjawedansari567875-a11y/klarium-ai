import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { colors, spacing } from '../theme/theme';

// TODO: Once you have a real AdMob account, replace TestIds.BANNER below
// with your real banner ad unit ID from the AdMob console (Apps > your app
// > Ad units). Using TestIds during development avoids any policy issues
// and shows Google's official placeholder test ads instead.
const AD_UNIT_ID = TestIds.BANNER;

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
