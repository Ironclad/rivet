import { Field } from '@atlaskit/form';
import Select from '@atlaskit/select';
import { DropdownEditorDefinition, ChartNode } from '@ironclad/rivet-core';
import { FC } from 'react';
import { SharedEditorProps } from './SharedEditorProps';

export const DefaultDropdownEditor: FC<
  SharedEditorProps & {
    editor: DropdownEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, onChange, editor }) => {
  const data = node.data as Record<string, unknown>;
  return (
    <Field name={editor.dataKey} label={editor.label} isDisabled={isReadonly}>
      {({ fieldProps }) => (
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
      )}
    </Field>
  );
};
