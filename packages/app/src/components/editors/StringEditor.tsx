import { Field } from '@atlaskit/form';
import TextField from '@atlaskit/textfield';
import { StringEditorDefinition, ChartNode } from '@ironclad/rivet-core';
import { FC } from 'react';
import { SharedEditorProps } from './SharedEditorProps';

export const DefaultStringEditor: FC<
  SharedEditorProps & {
    editor: StringEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, onChange, editor }) => {
  const data = node.data as Record<string, unknown>;
  return (
    <Field name={editor.dataKey} label={editor.label}>
      {({ fieldProps }) => (
        <TextField
          {...fieldProps}
          value={data[editor.dataKey] as string | undefined}
          isReadOnly={isReadonly}
          onChange={(e) =>
            onChange({
              ...node,
              data: {
                ...data,
                [editor.dataKey]: (e.target as HTMLInputElement).value,
              },
            })
          }
        />
      )}
    </Field>
  );
};
