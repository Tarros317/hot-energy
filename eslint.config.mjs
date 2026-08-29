import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

/**
 * eslint-config-next 16 ships native flat configs. Going through FlatCompat
 * (the older `compat.extends('next/core-web-vitals')` pattern) crashes on
 * ESLint 9.39 with "Converting circular structure to JSON", so the flat
 * exports are imported directly.
 */
const eslintConfig = [
  { ignores: ['.next/**', 'node_modules/**', 'scripts/**', 'next-env.d.ts'] },
  ...coreWebVitals,
  ...typescript,
];

export default eslintConfig;
