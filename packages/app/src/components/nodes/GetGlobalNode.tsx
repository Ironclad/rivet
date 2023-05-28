import { FC } from 'react';
import Select from '@atlaskit/select';
import TextField from '@atlaskit/textfield';
import { Field } from '@atlaskit/form';
import { css } from '@emotion/react';
import { Checkbox } from '@atlaskit/checkbox';
import {
  ArrayDataType,
  GetGlobalNode,
  dataTypeDisplayNames,
  getScalarTypeOf,
  isArrayDataType,
  scalarTypes,
} from '@ironclad/nodai-core';
import Toggle from '@atlaskit/toggle';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export const GetGlobalNodeBody: FC<{
  node: GetGlobalNode;
}> = ({ node }) => {
  return (
    <div>
      <h3>{node.data.id}</h3>
      <p>Type: {node.data.dataType}</p>
      {node.data.wait && <p>Waits for available data</p>}
    </div>
  );
};

const editorCss = css`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: stretch;
  width: 100%;
  align-content: start;
  align-items: center;
  column-gap: 16px;

  .use-input-toggle {
    align-self: center;
  }
`;

const checkboxCss = css`
  margin-top: 16px;
`;

const groupCss = css`
  display: grid;
  grid-template-columns: 1fr auto;
  column-gap: 16px;
  align-items: center;
`;

const validTypes = scalarTypes.filter((type) => type !== 'control-flow-excluded');

export const GetGlobalNodeEditor: FC<{
  node: GetGlobalNode;
  onChange?: (node: GetGlobalNode) => void;
}> = ({ node, onChange }) => {
  const scalarType = getScalarTypeOf(node.data.dataType);
  const isArray = isArrayDataType(node.data.dataType);

  const dataTypeOptions = validTypes.map((type) => ({
    label: dataTypeDisplayNames[type],
    value: type,
  }));

  const selectedOption = dataTypeOptions.find((option) => option.value === node.data.dataType);

  return (
    <div css={editorCss}>
      <Field name="input-id" label="ID" isDisabled={node.data.useIdInput}>
        {({ fieldProps }) => (
          <TextField
            {...fieldProps}
            value={node.data.id}
            onChange={(e) => onChange?.({ ...node, data: { ...node.data, id: (e.target as HTMLInputElement).value } })}
          />
        )}
      </Field>
      <Field name="use-input" label="Use Input">
        {({ fieldProps }) => (
          <Toggle
            {...fieldProps}
            isChecked={node.data.useIdInput}
            onChange={(e) => onChange?.({ ...node, data: { ...node.data, useIdInput: e.target.checked } })}
          />
        )}
      </Field>

      <div css={groupCss}>
        <Field name="data-type" label="Data Type">
          {({ fieldProps }) => (
            <Select
              {...fieldProps}
              options={dataTypeOptions}
              value={selectedOption}
              onChange={(selected) =>
                onChange?.({
                  ...node,
                  data: {
                    ...node.data,
                    dataType: isArray ? (`${selected!.value}[]` as ArrayDataType) : selected!.value,
                  },
                })
              }
            />
          )}
        </Field>
        <Field label=" " name="is-array">
          {({ fieldProps }) => (
            <Checkbox
              {...fieldProps}
              label="Array"
              css={checkboxCss}
              onChange={(e) =>
                onChange?.({
                  ...node,
                  data: {
                    ...node.data,
                    dataType: e.target.checked ? (`${scalarType}[]` as ArrayDataType) : scalarType,
                  },
                })
              }
            />
          )}
        </Field>
      </div>
      <div />

      <div className="use-input-toggle">
        <Field label="On-Demand" name="onDemand">
          {({ fieldProps }) => (
            <Toggle
              {...fieldProps}
              isChecked={node.data.onDemand}
              onChange={(e) =>
                onChange?.({
                  ...node,
                  data: { ...node.data, onDemand: e.target.checked, wait: e.target.checked ? false : node.data.wait },
                })
              }
            />
          )}
        </Field>
      </div>
      <div className="wait-toggle">
        <Field label="Wait" name="onDemand">
          {({ fieldProps }) => (
            <Toggle
              {...fieldProps}
              isChecked={node.data.wait}
              onChange={(e) =>
                onChange?.({
                  ...node,
                  data: {
                    ...node.data,
                    wait: e.target.checked,
                    onDemand: e.target.checked ? false : node.data.onDemand,
                  },
                })
              }
            />
          )}
        </Field>
      </div>
    </div>
  );
};

export const getGlobalNodeDescriptor: NodeComponentDescriptor<'getGlobal'> = {
  Body: GetGlobalNodeBody,
  Output: undefined,
  Editor: GetGlobalNodeEditor,
};
