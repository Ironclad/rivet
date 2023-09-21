import { Field, HelperMessage } from '@atlaskit/form';
import TextField from '@atlaskit/textfield';
import { ChartNode, NumberEditorDefinition } from '@ironclad/rivet-core';
import { FC } from 'react';
import { NodeChanged } from '../NodeEditor';
import { SharedEditorProps } from './SharedEditorProps';
import { getHelperMessage } from './editorUtils';

export const DefaultNumberEditor: FC<
  SharedEditorProps & {
    editor: NumberEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, isDisabled, onChange, editor }) => {
  const data = node.data as Record<string, unknown>;
  const helperMessage = getHelperMessage(editor, node.data);
  return (
    <Field name={editor.dataKey} label={editor.label} isDisabled={isDisabled}>
      {({ fieldProps }) => (
        <>
          <TextField
            isReadOnly={isReadonly}
            type="number"
            min={editor.min}
            max={editor.max}
            step={editor.step}
            {...fieldProps}
            defaultValue={(data[editor.dataKey] ?? editor.defaultValue) as number | undefined}
            onChange={(e) => {
              if (editor.allowEmpty && (e.target as HTMLInputElement).value === '') {
                onChange({
                  ...node,
                  data: {
                    ...data,
                    [editor.dataKey]: undefined,
                  },
                });
              } else {
                onChange({
                  ...node,
                  data: {
                    ...data,
                    [editor.dataKey]: (e.target as HTMLInputElement).valueAsNumber,
                  },
                });
              }
            }}
          />
          {helperMessage && <HelperMessage>{helperMessage}</HelperMessage>}
        </>
      )}
    </Field>
  );
};
