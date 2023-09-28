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

const definePITheme = (name: string, colors: { primary: string }) =>
  monaco.editor.defineTheme(`prompt-interpolation-${name}`, {
    base: 'vs-dark',
    inherit: true,
    rules: [{ token: 'prompt-replacement', foreground: colors.primary }],
    colors: {
      'editor.background': '#282c34',
    },
  });

definePITheme('molten', { primary: 'ff9900' });
definePITheme('grapefruit', { primary: 'ff8862' });
definePITheme('taffy', { primary: 'd6c2ff' });
