const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');

// NOT spreading @beaconvie/eslint-config here: both it and eslint-config-expo/flat register a
// `@typescript-eslint` plugin instance under the same flat-config plugin key, and ESLint 9 refuses
// to merge two different resolved instances of the same plugin name ("Cannot redefine plugin").
// eslint-config-expo/flat already ships TypeScript + React Native-aware rules, so it's the right
// base for this app; only pulling prettier-compat from the shared setup to stay consistent with
// the rest of the repo's formatting rules.
module.exports = [
  { ignores: ['dist/**', '.expo/**', 'expo-env.d.ts'] },
  ...expoConfig,
  prettier,
];
