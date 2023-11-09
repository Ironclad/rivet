module.exports = {
  extends: [
    '../../.eslintrc.cjs',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  root: true,
  plugins: ['react', 'react-hooks', '@emotion'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        project: true,
        ecmaVersion: 'latest',
      },
    },
  ],
  rules: {
    'react/no-unknown-property': ['error', { ignore: ['css'] }],
    'react/prop-types': 'off',
  },
};
