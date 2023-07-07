import { marked } from 'marked';
import { useMemo } from 'react';

export function useMarkdown(text: string | undefined, enabled: boolean = true) {
  return useMemo(() => {
    if (!enabled) {
      return { __html: '' };
    }

    const converted = marked(text ?? '', { mangle: false, headerIds: false });

    return { __html: converted };
  }, [text, enabled]);
}
