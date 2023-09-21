import { Field } from '@atlaskit/form';
import Toggle from '@atlaskit/toggle';
import { ToggleEditorDefinition, ChartNode } from '@ironclad/rivet-core';
import { FC } from 'react';
import { SharedEditorProps } from './SharedEditorProps';

export const DefaultToggleEditor: FC<
  SharedEditorProps & {
    editor: ToggleEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, onChange, editor }) => {
  const data = node.data as Record<string, unknown>;
  return (
    <Field name={editor.dataKey} label={editor.label}>
      {({ fieldProps }) => (
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
      )}
    </Field>
  );
};
