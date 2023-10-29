module.exports = {
  extends: '../../.eslintrc.cjs',
  root: true,
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        project: './packages/cli/tsconfig.json',
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  ],
};
