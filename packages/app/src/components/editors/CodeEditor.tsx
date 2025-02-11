import { HelperMessage, Label } from '@atlaskit/form';
import { type CodeEditorDefinition, type ChartNode } from '@ironclad/rivet-core';
import { useLatest, useDebounceFn, usePrevious } from 'ahooks';
import { type FC, useRef, useEffect, Suspense } from 'react';
import { type monaco } from '../../utils/monaco';
import { LazyCodeEditor } from '../LazyComponents';
import { type SharedEditorProps } from './SharedEditorProps';
import { getHelperMessage } from './editorUtils';

export const DefaultCodeEditor: FC<
  SharedEditorProps & {
    editor: CodeEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, isDisabled, onChange, editor: editorDef, onClose }) => {
  const helperMessage = getHelperMessage(editorDef, node.data);
  const nodeLatest = useLatest(node);

  const debouncedOnChange = useDebounceFn<(node: ChartNode) => void>(onChange, { wait: 100 });

  const onEditorChange = (newText: string) => {
    debouncedOnChange.run({
      ...nodeLatest.current,
      data: {
        ...(nodeLatest.current?.data as Record<string, unknown> | undefined),
        [editorDef.dataKey]: newText,
      },
    });
  };

  return (
    <CodeEditor
      value={(node.data as Record<string, unknown> | undefined)?.[editorDef.dataKey] as string | undefined}
      onChange={onEditorChange}
      isReadonly={isReadonly}
      isDisabled={isDisabled}
      autoFocus={editorDef.autoFocus}
      label={editorDef.label}
      name={editorDef.dataKey}
      helperMessage={helperMessage}
      onClose={onClose}
      language={editorDef.language}
      theme={editorDef.theme}
      id={node.id}
    />
  );
};

export const CodeEditor: FC<{
  value: string | undefined;
  onChange: (value: string) => void;
  isDisabled: boolean;
  isReadonly: boolean;
  autoFocus?: boolean;
  label: string;
  name?: string;
  helperMessage?: string;
  onClose?: () => void;
  theme?: string;
  language?: string;
  id?: string;
}> = ({
  value,
  onChange,
  isReadonly,
  isDisabled,
  autoFocus,
  label,
  name,
  helperMessage,
  onClose,
  theme,
  language,
  id,
}) => {
  const editorInstance = useRef<monaco.editor.IStandaloneCodeEditor>();

  const onChangeLatest = useLatest(onChange);
  const previousId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (editorInstance.current) {
      const currentValue = value;

      const textChanged = editorInstance.current.getValue() !== currentValue;
      const hasTextFocus = editorInstance.current.hasTextFocus();
      const isNewId = previousId.current !== id && previousId.current !== undefined;

      previousId.current = id;

      // Only set the text explicitly if we're not editing it and have a cursor position.
      if ((textChanged && !hasTextFocus) || isNewId) {
        editorInstance.current.setValue(currentValue ?? '');
      }

      editorInstance.current.updateOptions({
        readOnly: isReadonly,
      });
    }
  }, [value, isReadonly, id, previousId]);

  const handleKeyDown = (e: monaco.IKeyboardEvent) => {
    if (e.keyCode === 9 /* Escape */) {
      e.preventDefault();
      e.stopPropagation();
      onClose?.();
    }
  };

  return (
    <Suspense fallback={<div />}>
      <div className="editor-wrapper-wrapper">
        <Label htmlFor="">{label}</Label>
        {helperMessage && <HelperMessage>{helperMessage}</HelperMessage>}
        <div className="editor-wrapper">
          <LazyCodeEditor
            editorRef={editorInstance}
            text={value ?? ''}
            onChange={(newValue) => {
              onChangeLatest.current?.(newValue);
            }}
            theme={theme}
            language={language}
            isReadonly={isReadonly || isDisabled}
            onKeyDown={handleKeyDown}
            autoFocus={autoFocus}
          />
        </div>
      </div>
    </Suspense>
  );
};
