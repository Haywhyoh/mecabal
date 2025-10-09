const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure proper module resolution for all platforms
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add node modules resolution
config.resolver.nodeModulesPaths = [
  './node_modules',
  '../node_modules',
];

// Handle Supabase module resolution
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Add source extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

// Fix React-Is module resolution and expo-asset
config.resolver.alias = {
  'react-is': require.resolve('react-is'),
  'hoist-non-react-statics': require.resolve('hoist-non-react-statics'),
  'expo-asset': require.resolve('expo-asset'),
};

// Clear Metro cache
config.resetCache = true;

module.exports = config;
