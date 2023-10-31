import { Field, HelperMessage } from '@atlaskit/form';
import Select from '@atlaskit/select';
import { type DropdownEditorDefinition, type ChartNode } from '@ironclad/rivet-core';
import { useRef, type FC } from 'react';
import { type SharedEditorProps } from './SharedEditorProps';
import { getHelperMessage } from './editorUtils';
import Portal from '@atlaskit/portal';

export const DefaultDropdownEditor: FC<
  SharedEditorProps & {
    editor: DropdownEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, isDisabled, onChange, editor }) => {
  const data = node.data as Record<string, unknown>;
  const helperMessage = getHelperMessage(editor, node.data);
  const menuPortalTarget = useRef<HTMLDivElement>(null);

  const selectedValue =
    data[editor.dataKey] == null
      ? editor.options.find((option) => option.value === editor.defaultValue)
      : editor.options.find((option) => option.value === data[editor.dataKey]);

  return (
    <Field name={editor.dataKey} label={editor.label} isDisabled={isReadonly || isDisabled}>
      {({ fieldProps }) => (
        <>
          <Select
            {...fieldProps}
            options={editor.options}
            value={selectedValue}
            menuPortalTarget={menuPortalTarget.current}
            autoFocus={editor.autoFocus}
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
          <Portal>
            <div ref={menuPortalTarget} />
          </Portal>
          {helperMessage && <HelperMessage>{helperMessage}</HelperMessage>}
        </>
      )}
    </Field>
  );
};
