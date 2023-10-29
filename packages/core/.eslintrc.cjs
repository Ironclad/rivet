module.exports = {
  extends: '../../.eslintrc.cjs',
  root: true,
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        project: `${__dirname}/tsconfig.eslint.json`,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  ],
};
