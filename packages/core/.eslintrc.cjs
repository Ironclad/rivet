module.exports = {
  extends: '../../.eslintrc.cjs',
  root: true,
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        project: './packages/core/tsconfig.eslint.json',
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  ],
};
