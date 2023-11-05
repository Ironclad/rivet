import {
  type ChartNode,
  type DataValue,
  type StringDataValue,
  type BoolDataValue,
  type DynamicEditorDefinition,
} from '@ironclad/rivet-core';
import { type FC } from 'react';
import { match } from 'ts-pattern';
import { StringEditor } from './StringEditor';
import { type SharedEditorProps } from './SharedEditorProps';
import { ToggleEditor } from './ToggleEditor';
import { getHelperMessage } from './editorUtils';
import { NumberEditor } from './NumberEditor';

export const DefaultDynamicEditor: FC<
  SharedEditorProps & {
    editor: DynamicEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, onChange, editor, isDisabled, onClose }) => {
  const dataType = editor.dataType;
  const data = node.data as Record<string, unknown>;
  const dynamicData = data[editor.dataKey] as Record<string, DataValue> | undefined;
  const dynamicDataValue = dynamicData?.[editor.dynamicDataKey] as DataValue | undefined;

  const helperMessage = getHelperMessage(editor, node.data);

  return match(dataType)
    .with('string', () => (
      <StringEditor
        value={(dynamicDataValue as StringDataValue | undefined)?.value ?? ''}
        isReadonly={isReadonly}
        onChange={(newValue) => {
          onChange({
            ...node,
            data: {
              ...data,
              [editor.dataKey]: {
                ...dynamicData,
                [editor.dynamicDataKey]: {
                  type: 'string',
                  value: newValue,
                },
              },
            },
          });
        }}
        label={editor.label}
        name={editor.dynamicDataKey}
        isDisabled={isDisabled}
        autoFocus={editor.autoFocus}
        onClose={onClose}
        helperMessage={helperMessage}
      />
    ))
    .with('boolean', () => (
      <ToggleEditor
        value={(dynamicDataValue as BoolDataValue | undefined)?.value ?? false}
        isReadonly={isReadonly}
        onChange={(newValue) => {
          onChange({
            ...node,
            data: {
              ...data,
              [editor.dataKey]: {
                ...dynamicData,
                [editor.dynamicDataKey]: {
                  type: 'boolean',
                  value: newValue,
                },
              },
            },
          });
        }}
        label={editor.label}
        name={editor.dynamicDataKey}
        isDisabled={isDisabled}
        helperMessage={helperMessage}
      />
    ))
    .with('number', () => (
      <NumberEditor
        value={(dynamicDataValue as number | undefined) ?? 0}
        isReadonly={isReadonly}
        onChange={(newValue) => {
          onChange({
            ...node,
            data: {
              ...data,
              [editor.dataKey]: {
                ...dynamicData,
                [editor.dynamicDataKey]: {
                  type: 'number',
                  value: newValue,
                },
              },
            },
          });
        }}
        label={editor.label}
        name={editor.dynamicDataKey}
        isDisabled={isDisabled}
        helperMessage={helperMessage}
      />
    ))
    .otherwise(() => null);
};
