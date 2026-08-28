const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Required for Firebase JS SDK v10+ to bundle correctly with Metro/Expo.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
