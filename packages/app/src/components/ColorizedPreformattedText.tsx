import { FC, useLayoutEffect, useRef } from 'react';
import { monaco } from '../utils/monaco';

export const ColorizedPreformattedText: FC<{ text: string; language: string; theme?: string }> = ({
  text,
  language,
  theme,
}) => {
  const bodyRef = useRef<HTMLPreElement>(null);

  useLayoutEffect(() => {
    monaco.editor.colorizeElement(bodyRef.current!, {
      theme: theme ?? 'vs-dark',
    });
  }, [text, theme]);

  return (
    <pre ref={bodyRef} data-lang={language}>
      {text}
    </pre>
  );
};

export default ColorizedPreformattedText;
