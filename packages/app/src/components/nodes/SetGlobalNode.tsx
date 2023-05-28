import { FC } from 'react';
import Select from '@atlaskit/select';
import TextField from '@atlaskit/textfield';
import { Field } from '@atlaskit/form';
import { css } from '@emotion/react';
import { Checkbox } from '@atlaskit/checkbox';
import { DataType, SetGlobalNode, ScalarType, dataTypeDisplayNames, scalarTypes } from '@ironclad/nodai-core';
import Toggle from '@atlaskit/toggle';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export const SetGlobalNodeBody: FC<{
  node: SetGlobalNode;
}> = ({ node }) => {
  return (
    <div>
      <h3>{node.data.id}</h3>
      <p>Type: {node.data.dataType}</p>
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

export const SetGlobalNodeEditor: FC<{
  node: SetGlobalNode;
  onChange?: (node: SetGlobalNode) => void;
}> = ({ node, onChange }) => {
  const SetGlobalNode = node as SetGlobalNode;

  const scalarType = SetGlobalNode.data.dataType.replace('[]', '') as ScalarType;
  const isArray = SetGlobalNode.data.dataType.endsWith('[]');

  const dataTypeOptions = validTypes.map((type) => ({
    label: dataTypeDisplayNames[type],
    value: type,
  }));

  const selectedOption = dataTypeOptions.find((option) => option.value === SetGlobalNode.data.dataType);

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
                  data: { ...node.data, dataType: isArray ? (`${selected!.value}[]` as DataType) : selected!.value },
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
                  data: { ...node.data, dataType: e.target.checked ? (`${scalarType}[]` as DataType) : scalarType },
                })
              }
            />
          )}
        </Field>
      </div>
      <div />
    </div>
  );
};

export const setGlobalNodeDescriptor: NodeComponentDescriptor<'setGlobal'> = {
  Body: SetGlobalNodeBody,
  Output: undefined,
  Editor: SetGlobalNodeEditor,
};
