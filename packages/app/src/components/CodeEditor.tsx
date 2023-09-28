import { useLatest } from 'ahooks';
import { type FC, type MutableRefObject, useEffect, useRef } from 'react';
import { monaco } from '../utils/monaco.js';
import { useRecoilValue } from 'recoil';
import { themeState } from '../state/settings';

export const CodeEditor: FC<{
  text: string;
  isReadonly?: boolean;
  onChange?: (newText: string) => void;
  language?: string;
  theme?: string;
  autoFocus?: boolean;
  onKeyDown?: (e: monaco.IKeyboardEvent) => void;
  onBlur?: () => void;
  editorRef?: MutableRefObject<monaco.editor.IStandaloneCodeEditor | undefined>;
  scrollBeyondLastLine?: boolean;
}> = ({
  text,
  isReadonly,
  onChange,
  language,
  theme,
  autoFocus,
  onKeyDown,
  onBlur,
  editorRef,
  scrollBeyondLastLine,
}) => {
  const editorContainer = useRef<HTMLDivElement>(null);
  const editorInstance = useRef<monaco.editor.IStandaloneCodeEditor>();

  const onChangeLatest = useLatest(onChange);

  const appTheme = useRecoilValue(themeState);
  const actualTheme = theme === 'prompt-interpolation' ? `prompt-interpolation-${appTheme}` : theme;

  useEffect(() => {
    if (!editorContainer.current) {
      return;
    }

    const editor = monaco.editor.create(editorContainer.current, {
      theme: actualTheme ?? 'vs-dark',
      lineNumbers: 'on',
      glyphMargin: false,
      folding: false,
      lineNumbersMinChars: 2,
      language,
      minimap: {
        enabled: false,
      },
      wordWrap: 'on',
      readOnly: isReadonly,
      value: text,
      scrollBeyondLastLine,
    });

    const onResize = () => {
      editor.layout();
    };

    editor.layout();

    window.addEventListener('resize', onResize);

    editor.onDidChangeModelContent(() => {
      onChangeLatest.current?.(editor.getValue());
    });

    editor.onDidBlurEditorWidget(() => {
      onBlur?.();
    });

    editorInstance.current = editor;
    if (editorRef) {
      editorRef.current = editor;
    }

    const latestBeforeDispose = onChangeLatest.current;

    return () => {
      latestBeforeDispose?.(editor.getValue());
      editor.dispose();
      window.removeEventListener('resize', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editorInstance.current && actualTheme) {
      editorInstance.current.updateOptions({
        theme: actualTheme,
      });
    }
  }, [actualTheme]);

  useEffect(() => {
    if (onKeyDown) {
      const dispose = editorInstance.current?.onKeyDown(onKeyDown);
      return () => {
        dispose?.dispose();
      };
    }
  }, [onKeyDown]);

  useEffect(() => {
    if (autoFocus) {
      editorInstance.current?.focus();
    }
  }, [autoFocus]);

  return <div ref={editorContainer} className="editor-container" />;
};

export default CodeEditor;
