module.exports = {
  extends: '../../.eslintrc.cjs',
  root: true,
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        project: './packages/node/tsconfig.eslint.json',
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  ],
};
