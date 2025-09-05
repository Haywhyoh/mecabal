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

module.exports = config;
