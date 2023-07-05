import { marked } from 'marked';
import { useMemo } from 'react';

export function useMarkdown(text: string | undefined) {
  return useMemo(() => {
    const converted = marked(text ?? '', { mangle: false, headerIds: false });

    return { __html: converted };
  }, [text]);
}
