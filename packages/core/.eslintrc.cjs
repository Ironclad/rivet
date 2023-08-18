module.exports = {
  extends: '../../.eslintrc.cjs',
  root: true,
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        project: 'packages/core/tsconfig.with-tests.json',
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  ],
};
