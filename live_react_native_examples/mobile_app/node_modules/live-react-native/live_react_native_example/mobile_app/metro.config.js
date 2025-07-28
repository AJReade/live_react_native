const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../../');

const config = getDefaultConfig(projectRoot);

// 1. Watch the parent directory (where our library is)
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages, and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force single instance of React for our library - this is critical!
config.resolver.alias = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
};

// 4. Ensure consistent module resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// 5. Force resolving from source instead of dist to avoid bundling issues
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// 6. Additional resolver settings for library
config.resolver.sourceExts = [...config.resolver.sourceExts, 'ts', 'tsx'];

module.exports = config;
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../../');

const config = getDefaultConfig(projectRoot);

// 1. Watch the parent directory (where our library is)
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages, and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force single instance of React for our library - this is critical!
config.resolver.alias = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
};

// 4. Ensure consistent module resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// 5. Force resolving from source instead of dist to avoid bundling issues
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// 6. Additional resolver settings for library
config.resolver.sourceExts = [...config.resolver.sourceExts, 'ts', 'tsx'];

module.exports = config;