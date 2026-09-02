const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// pnpm links workspace/hoisted dependencies into node_modules via symlinks rather than
// duplicating them into every app's node_modules — Metro has to watch the workspace root and
// follow symlinks, or it never sees @beaconvie/types (or anything else hoisted). Deliberately NOT
// setting `disableHierarchicalLookup`/a custom `nodeModulesPaths`: that combination is for
// strict/non-symlink layouts and, tried here, broke resolution of pnpm's own nested `.pnpm`
// symlink chain (phantom deps of phantom deps, e.g. @expo/metro-runtime -> @expo/log-box, failed
// to resolve one at a time). Plain symlink-following + the default upward Node walk is what
// actually matches how pnpm lays out node_modules.
config.watchFolders = [workspaceRoot];
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
