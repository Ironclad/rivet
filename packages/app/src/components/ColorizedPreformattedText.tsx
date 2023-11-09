import { type FC, useLayoutEffect, useRef } from 'react';
import { monaco } from '../utils/monaco';
import { useRecoilValue } from 'recoil';
import { themeState } from '../state/settings';

export const ColorizedPreformattedText: FC<{ text: string; language: string; theme?: string }> = ({
  text,
  language,
  theme,
}) => {
  const bodyRef = useRef<HTMLPreElement>(null);
  const appTheme = useRecoilValue(themeState);
  const actualTheme = theme === 'prompt-interpolation' ? `prompt-interpolation-${appTheme}` : theme;

  useLayoutEffect(() => {
    monaco.editor.colorizeElement(bodyRef.current!, {
      theme: actualTheme ?? 'vs-dark',
    });
  }, [text, actualTheme]);

  return (
    <pre ref={bodyRef} data-lang={language}>
      {text}
    </pre>
  );
};

export default ColorizedPreformattedText;
