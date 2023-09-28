import Checkbox from '@atlaskit/checkbox';
import { Field, HelperMessage } from '@atlaskit/form';
import Select from '@atlaskit/select';
import { css } from '@emotion/react';
import {
  scalarTypes,
  type DataTypeSelectorEditorDefinition,
  type ChartNode,
  type DataType,
  getScalarTypeOf,
  isArrayDataType,
  dataTypeDisplayNames,
} from '@ironclad/rivet-core';
import { type FC } from 'react';
import { type SharedEditorProps } from './SharedEditorProps';
import { getHelperMessage } from './editorUtils';

const validSelectableDataTypes = scalarTypes.filter((type) => type !== 'control-flow-excluded');

export const DefaultDataTypeSelector: FC<
  SharedEditorProps & {
    editor: DataTypeSelectorEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, isDisabled, onChange, editor }) => {
  const data = node.data as Record<string, unknown>;
  const dataType = data[editor.dataKey] as DataType | undefined;
  const helperMessage = getHelperMessage(editor, node.data);

  const scalarType = dataType ? getScalarTypeOf(dataType) : undefined;
  const isArray = dataType ? isArrayDataType(dataType) : undefined;

  const dataTypeOptions = validSelectableDataTypes.map((type) => ({
    label: dataTypeDisplayNames[type],
    value: type,
  }));

  const selectedOption = dataTypeOptions.find((option) => option.value === dataType);

  return (
    <div className="data-type-selector">
      <Field name="data-type" label="Data Type" isDisabled={isReadonly || isDisabled}>
        {({ fieldProps }) => (
          <Select
            {...fieldProps}
            options={dataTypeOptions}
            value={selectedOption}
            onChange={(selected) =>
              onChange?.({
                ...node,
                data: {
                  ...data,
                  [editor.dataKey]: isArray ? (`${selected!.value}[]` as DataType) : selected!.value,
                },
              })
            }
          />
        )}
      </Field>
      <Field label=" " name="is-array" isDisabled={isReadonly}>
        {({ fieldProps }) => (
          <Checkbox
            {...fieldProps}
            label="Array"
            css={css`
              margin-top: 16px;
            `}
            onChange={(e) =>
              onChange?.({
                ...node,
                data: {
                  ...data,
                  [editor.dataKey]: e.target.checked ? (`${scalarType}[]` as DataType) : scalarType,
                },
              })
            }
            isDisabled={isDisabled}
          />
        )}
      </Field>
      {helperMessage && <HelperMessage>{helperMessage}</HelperMessage>}
    </div>
  );
};
