import * as monaco from 'monaco-editor';

import { language as promptInterpolationMarkdownLanguage } from './monaco/markdown';

export { monaco };

monaco.languages.register({ id: 'prompt-interpolation' });
monaco.languages.register({ id: 'prompt-interpolation-markdown' });

monaco.languages.setMonarchTokensProvider('prompt-interpolation', {
  tokenizer: {
    root: [[/\{\{[^}]+\}\}/, 'prompt-replacement']],
  },
});

monaco.languages.setMonarchTokensProvider('prompt-interpolation-markdown', promptInterpolationMarkdownLanguage);

monaco.editor.defineTheme('prompt-interpolation', {
  base: 'vs-dark',
  inherit: true,
  rules: [{ token: 'prompt-replacement', foreground: 'ff9900' }],
  colors: {
    'editor.background': '#282c34',
  },
});
