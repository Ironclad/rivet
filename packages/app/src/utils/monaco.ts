import * as monaco from 'monaco-editor';

export { monaco };

monaco.languages.register({ id: 'prompt-interpolation' });

monaco.languages.setMonarchTokensProvider('prompt-interpolation', {
  tokenizer: {
    root: [[/\{\{[^}]+\}\}/, 'prompt-replacement']],
  },
});

monaco.editor.defineTheme('prompt-interpolation', {
  base: 'vs-dark',
  inherit: true,
  rules: [{ token: 'prompt-replacement', foreground: 'ff9900' }],
  colors: {
    'editor.background': '#282c34',
  },
});
