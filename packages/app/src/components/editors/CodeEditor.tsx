import { Label } from '@atlaskit/form';
import { CodeEditorDefinition, ChartNode } from '@ironclad/rivet-core';
import { useLatest, useDebounceFn } from 'ahooks';
import { FC, useRef, useEffect, Suspense } from 'react';
import { monaco } from '../../utils/monaco';
import { LazyCodeEditor } from '../LazyComponents';
import { SharedEditorProps } from './SharedEditorProps';

export const DefaultCodeEditor: FC<
  SharedEditorProps & {
    editor: CodeEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, onChange, editor: editorDef, onClose }) => {
  const editorInstance = useRef<monaco.editor.IStandaloneCodeEditor>();

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

  useEffect(() => {
    if (editorInstance.current) {
      const currentValue = (nodeLatest.current?.data as Record<string, unknown> | undefined)?.[editorDef.dataKey] as
        | string
        | undefined;
      editorInstance.current.setValue(currentValue ?? '');

      editorInstance.current.updateOptions({
        readOnly: isReadonly,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id, isReadonly]);

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
        <Label htmlFor="">{editorDef.label}</Label>
        <div className="editor-wrapper">
          <LazyCodeEditor
            editorRef={editorInstance}
            text={
              ((nodeLatest.current?.data as Record<string, unknown>)[editorDef.dataKey] as string | undefined) ?? ''
            }
            onChange={onEditorChange}
            theme={editorDef.theme}
            language={editorDef.language}
            isReadonly={isReadonly}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>
    </Suspense>
  );
};
