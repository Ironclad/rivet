// packages/app/eslint.config.js
import baseConfig from '../../eslint.config.mjs';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import * as emotion from '@emotion/eslint-plugin';
import tseslint from '@typescript-eslint/eslint-plugin';
import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Use compat to load the react configs
const reactConfigs = [
  ...compat.extends('plugin:react/recommended'),
  ...compat.extends('plugin:react/jsx-runtime'),
  ...compat.extends('plugin:react-hooks/recommended'),
];

export default [
  ...baseConfig,
  ...reactConfigs,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react: react,
      'react-hooks': reactHooks,
      '@emotion': emotion,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/no-unknown-property': ['error', { ignore: ['css'] }],
      'react/prop-types': 'off',
      '@typescript-eslint/no-floating-promises': 'off', // jotai :/
    },
  },
  // TypeScript-specific overrides
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: true,
        ecmaVersion: 'latest',
      },
    },
  },
];
