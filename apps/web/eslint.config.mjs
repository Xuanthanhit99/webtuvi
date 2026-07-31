import { FlatCompat } from '@eslint/eslintrc';
import baseConfig from '@beaconvie/eslint-config';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  { ignores: ['next-env.d.ts', 'playwright-report/**', 'test-results/**'] },
  ...compat.extends('next/core-web-vitals'),
  ...baseConfig,
];
