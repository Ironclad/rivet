import { Field, HelperMessage } from '@atlaskit/form';
import TextField from '@atlaskit/textfield';
import { type StringEditorDefinition, type ChartNode } from '@ironclad/rivet-core';
import { type FC } from 'react';
import { type SharedEditorProps } from './SharedEditorProps';
import { getHelperMessage } from './editorUtils';

export const DefaultStringEditor: FC<
  SharedEditorProps & {
    editor: StringEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, isDisabled, onChange, editor, onClose }) => {
  const data = node.data as Record<string, unknown>;
  const helperMessage = getHelperMessage(editor, node.data);
  return (
    <StringEditor
      value={data[editor.dataKey] as string | undefined}
      isReadonly={isReadonly}
      isDisabled={isDisabled}
      autoFocus={editor.autoFocus}
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
      placeholder={editor.placeholder}
      maxLength={editor.maxLength}
      helperMessage={helperMessage}
      onClose={onClose}
    />
  );
};

export const StringEditor: FC<{
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  isDisabled: boolean;
  isReadonly: boolean;
  autoFocus?: boolean;
  label: string;
  name?: string;
  helperMessage?: string;
  placeholder?: string;
  maxLength?: number;
  onClose?: () => void;
}> = ({
  value,
  onChange,
  isReadonly,
  isDisabled,
  label,
  name,
  autoFocus,
  helperMessage,
  placeholder,
  maxLength,
  onClose,
}) => {
  return (
    <Field name={name ?? label} label={label} isDisabled={isDisabled}>
      {({ fieldProps }) => (
        <>
          <TextField
            {...fieldProps}
            value={value}
            isReadOnly={isReadonly}
            autoFocus={autoFocus}
            autoComplete="off"
            spellCheck={false}
            placeholder={placeholder}
            maxLength={maxLength}
            onChange={(e) => onChange((e.target as HTMLInputElement).value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                onClose?.();
              }
            }}
          />
          {helperMessage && <HelperMessage>{helperMessage}</HelperMessage>}
        </>
      )}
    </Field>
  );
};
