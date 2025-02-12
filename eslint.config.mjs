import globals from 'globals';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';

export default [
  {
    files: ['**/*.{js,jsx,ts,tsx,mts,cts}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./packages/*/tsconfig.eslint.json'],
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },

    plugins: {
      '@typescript-eslint': typescript,
      import: importPlugin,
    },

    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx', '.mts', '.cts'],
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: 'packages/*/tsconfig.json',
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.mts', '.cts'],
        },
      },
    },

    rules: {
      // Basic ESLint rules
      semi: ['error', 'always'],
      eqeqeq: ['error', 'smart'],
      'generator-star-spacing': 'off',
      'no-async-promise-executor': 'error',
      'no-void': 'off',
      'prefer-const': 'error',
      'eol-last': 'off',
      'no-extra-boolean-cast': 'off',
      'no-prototype-builtins': 'off',
      'no-undef-init': 'off',
      'spaced-comment': 'off',
      'padded-blocks': 'off',
      'multiline-ternary': 'off',
      'no-trailing-spaces': 'off',
      'yield-star-spacing': 'off',
      'no-unneeded-ternary': 'off',
      'no-case-declarations': 'off',
      'no-useless-return': 'off',

      // Import plugin rules
      'import/no-duplicates': 'error',
      'import/no-cycle': 'warn',
      'import/first': 'off',

      // TypeScript-specific rules
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-extra-parens': 'off',
      '@typescript-eslint/semi': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/space-before-function-paren': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/comma-dangle': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/member-delimiter-style': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',
      '@typescript-eslint/prefer-reduce-type-parameter': 'off',
      '@typescript-eslint/prefer-ts-expect-error': 'off',
      '@typescript-eslint/indent': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-base-to-string': 'off',
      '@typescript-eslint/method-signature-style': 'off',
      '@typescript-eslint/return-await': 'off',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-indexed-object-style': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/promise-function-async': 'off',
      '@typescript-eslint/lines-between-class-members': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/quotes': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/consistent-generic-constructors': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off',
      '@typescript-eslint/no-implied-eval': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-dynamic-delete': 'off',
      '@typescript-eslint/no-invalid-void-type': 'off',
      '@typescript-eslint/no-throw-literal': 'off',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },

  // Configuration for ESLint config files
  {
    files: ['.eslint.config.mjs'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        ...globals.node,
      },
    },
  },
];
