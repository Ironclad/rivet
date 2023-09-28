import { Field, HelperMessage } from '@atlaskit/form';
import Select from '@atlaskit/select';
import { type DropdownEditorDefinition, type ChartNode } from '@ironclad/rivet-core';
import { type FC } from 'react';
import { type SharedEditorProps } from './SharedEditorProps';
import { getHelperMessage } from './editorUtils';

export const DefaultDropdownEditor: FC<
  SharedEditorProps & {
    editor: DropdownEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, isDisabled, onChange, editor }) => {
  const data = node.data as Record<string, unknown>;
  const helperMessage = getHelperMessage(editor, node.data);
  return (
    <Field name={editor.dataKey} label={editor.label} isDisabled={isReadonly || isDisabled}>
      {({ fieldProps }) => (
        <>
          <Select
            {...fieldProps}
            options={editor.options}
            value={editor.options.find((option) => option.value === data[editor.dataKey])}
            onChange={(selected) =>
              onChange({
                ...node,
                data: {
                  ...data,
                  [editor.dataKey]: selected!.value,
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
