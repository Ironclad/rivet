import baseConfig from '../../eslint.config.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default [
  {
    ignores: ['bin/**/executor-bundle.cjs'],
  },
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
    languageOptions: {
      parserOptions: {
        project: `${__dirname}/tsconfig.eslint.json`,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },
];
