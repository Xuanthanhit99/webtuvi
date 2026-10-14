const { getDefaultConfig } = require('expo/metro-config');

// Expo SDK 52+ detects pnpm/npm/yarn monorepos automatically. Keeping this file intentionally
// minimal avoids overriding Metro's supported workspace and symlink resolution defaults.
const config = getDefaultConfig(__dirname);

module.exports = config;
