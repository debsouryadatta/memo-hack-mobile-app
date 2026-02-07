const path = require('path');
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

// Find the monorepo root
const workspaceRoot = path.resolve(__dirname, '../..');
const config = getDefaultConfig(__dirname);

// 1. Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages from
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = withNativeWind(config, {
  input: './app/global.css',
  projectRoot: __dirname,
  inlineRem: 16,
})