const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Watch for changes in the js directory
config.watchFolders = [
  path.resolve(__dirname, 'js'),
  path.resolve(__dirname, 'example'),
];

// Support for TypeScript
config.resolver.sourceExts.push('ts', 'tsx');

// Support for symlinks (useful for local development)
config.resolver.unstable_enableSymlinks = true;

// Platform-specific extensions
config.resolver.platforms = ['native', 'ios', 'android', 'web'];

module.exports = config;