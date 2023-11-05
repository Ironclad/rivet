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
    <ToggleEditor
      value={data[editor.dataKey] as boolean | undefined}
      isReadonly={isReadonly}
      isDisabled={isDisabled}
      onChange={(newValue) => {
        onChange({
          ...node,
          data: {
            ...data,
            [editor.dataKey]: newValue,
          },
        });
      }}
      label={editor.label}
      name={editor.dataKey}
      helperMessage={helperMessage}
    />
  );
};

export const ToggleEditor: FC<{
  value: boolean | undefined;
  onChange: (value: boolean | undefined) => void;
  isDisabled: boolean;
  isReadonly: boolean;
  label: string;
  name?: string;
  helperMessage?: string;
  onClose?: () => void;
}> = ({ value, onChange, isReadonly, isDisabled, label, name, helperMessage, onClose }) => {
  return (
    <Field name={name ?? label} label={label} isDisabled={isDisabled}>
      {({ fieldProps }) => (
        <>
          <Toggle
            {...fieldProps}
            isChecked={value}
            isDisabled={isReadonly}
            onChange={(e) => onChange(e.target.checked)}
          />
          {helperMessage && <HelperMessage>{helperMessage}</HelperMessage>}
        </>
      )}
    </Field>
  );
};
