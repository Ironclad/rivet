import { Field, HelperMessage } from '@atlaskit/form';
import TextField from '@atlaskit/textfield';
import { type ChartNode, type NumberEditorDefinition } from '@ironclad/rivet-core';
import { type FC } from 'react';
import { type SharedEditorProps } from './SharedEditorProps';
import { getHelperMessage } from './editorUtils';

export const DefaultNumberEditor: FC<
  SharedEditorProps & {
    editor: NumberEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, isDisabled, onChange, editor, onClose }) => {
  const data = node.data as Record<string, unknown>;
  const helperMessage = getHelperMessage(editor, node.data);
  return (
    <NumberEditor
      value={data[editor.dataKey] as number | undefined}
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
      helperMessage={helperMessage}
      onClose={onClose}
      min={editor.min}
      max={editor.max}
      step={editor.step}
      allowEmpty={editor.allowEmpty}
      defaultValue={editor.defaultValue}
    />
  );
};

export const NumberEditor: FC<{
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  isDisabled: boolean;
  isReadonly: boolean;
  autoFocus?: boolean;
  label: string;
  name?: string;
  helperMessage?: string;
  onClose?: () => void;
  min?: number;
  max?: number;
  step?: number;
  allowEmpty?: boolean;
  defaultValue?: number;
}> = ({
  value,
  onChange,
  isReadonly,
  isDisabled,
  label,
  name,
  autoFocus,
  helperMessage,
  onClose,
  min,
  max,
  step,
  allowEmpty,
  defaultValue,
}) => {
  return (
    <Field name={name ?? label} label={label} isDisabled={isDisabled}>
      {({ fieldProps }) => (
        <>
          <TextField
            {...fieldProps}
            type="number"
            min={min}
            max={max}
            step={step}
            defaultValue={value ?? defaultValue}
            isReadOnly={isReadonly}
            autoFocus={autoFocus}
            onChange={(e) => {
              if (allowEmpty && (e.target as HTMLInputElement).value === '') {
                onChange(undefined);
              } else {
                onChange((e.target as HTMLInputElement).valueAsNumber);
              }
            }}
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
