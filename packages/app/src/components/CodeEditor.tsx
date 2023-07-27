import { useLatest } from 'ahooks';
import { FC, MutableRefObject, useEffect, useRef } from 'react';
import { monaco } from '../utils/monaco.js';

export const CodeEditor: FC<{
  text: string;
  isReadonly?: boolean;
  onChange?: (newText: string) => void;
  language?: string;
  theme?: string;
  autoFocus?: boolean;
  onKeyDown?: (e: monaco.IKeyboardEvent) => void;
  editorRef?: MutableRefObject<monaco.editor.IStandaloneCodeEditor | undefined>;
}> = ({ text, isReadonly, onChange, language, theme, autoFocus, onKeyDown, editorRef }) => {
  const editorContainer = useRef<HTMLDivElement>(null);
  const editorInstance = useRef<monaco.editor.IStandaloneCodeEditor>();

  const onChangeLatest = useLatest(onChange);

  useEffect(() => {
    if (!editorContainer.current) {
      return;
    }

    const editor = monaco.editor.create(editorContainer.current, {
      theme: theme ?? 'vs-dark',
      lineNumbers: 'on',
      glyphMargin: false,
      folding: false,
      lineNumbersMinChars: 2,
      language: language,
      minimap: {
        enabled: false,
      },
      wordWrap: 'on',
      readOnly: isReadonly,
      value: text,
      automaticLayout: true,
    });

    editor.onDidChangeModelContent(() => {
      onChangeLatest.current?.(editor.getValue());
    });

    editorInstance.current = editor;
    if (editorRef) {
      editorRef.current = editor;
    }

    return () => {
      editor.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
