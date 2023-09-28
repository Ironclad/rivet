import { Field, HelperMessage } from '@atlaskit/form';
import Toggle from '@atlaskit/toggle';
import { type ToggleEditorDefinition, type ChartNode } from '@ironclad/rivet-core';
import { type FC } from 'react';
import { type SharedEditorProps } from './SharedEditorProps';
import { getHelperMessage } from './editorUtils';

export const DefaultToggleEditor: FC<
  SharedEditorProps & {
    editor: ToggleEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, isDisabled, onChange, editor }) => {
  const data = node.data as Record<string, unknown>;
  const helperMessage = getHelperMessage(editor, node.data);
  return (
    <Field name={editor.dataKey} label={editor.label} isDisabled={isDisabled}>
      {({ fieldProps }) => (
        <>
          <Toggle
            {...fieldProps}
            isChecked={data[editor.dataKey] as boolean | undefined}
            isDisabled={isReadonly}
            onChange={(e) =>
              onChange({
                ...node,
                data: {
                  ...data,
                  [editor.dataKey]: e.target.checked,
                },
              })
            }
          />
          {helperMessage && <HelperMessage>{helperMessage}</HelperMessage>}
        </>
      )}
    </Field>
  );
};
