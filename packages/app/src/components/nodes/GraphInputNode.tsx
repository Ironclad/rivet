import { FC } from 'react';
import Select from '@atlaskit/select';
import TextField from '@atlaskit/textfield';
import { Field } from '@atlaskit/form';
import { css } from '@emotion/react';
import { Checkbox } from '@atlaskit/checkbox';
import { useRecoilValue } from 'recoil';
import { lastRunData } from '../../state/dataFlow';
import { RenderDataValue } from '../RenderDataValue';
import { DataType, GraphInputNode, PortId, ScalarType, dataTypeDisplayNames, scalarTypes } from '@ironclad/nodai-core';
import Toggle from '@atlaskit/toggle';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export type GraphInputNodeBodyProps = {
  node: GraphInputNode;
};

export const GraphInputNodeBody: FC<GraphInputNodeBodyProps> = ({ node }) => {
  return (
    <div>
      <h3>{node.data.id}</h3>
      <p>Type: {node.data.dataType}</p>
    </div>
  );
};

export type GraphInputNodeEditorProps = {
  node: GraphInputNode;
  onChange?: (node: GraphInputNode) => void;
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

export const GraphInputNodeEditor: FC<GraphInputNodeEditorProps> = ({ node, onChange }) => {
  const graphInputNode = node as GraphInputNode;

  const scalarType = graphInputNode.data.dataType.replace('[]', '') as ScalarType;
  const isArray = graphInputNode.data.dataType.endsWith('[]');

  const dataTypeOptions = validTypes.map((type) => ({
    label: dataTypeDisplayNames[type],
    value: type,
  }));

  const selectedOption = dataTypeOptions.find((option) => option.value === graphInputNode.data.dataType);

  return (
    <div css={editorCss}>
      <Field name="input-id" label="ID">
        {({ fieldProps }) => (
          <TextField
            {...fieldProps}
            value={node.data.id}
            onChange={(e) => onChange?.({ ...node, data: { ...node.data, id: (e.target as HTMLInputElement).value } })}
          />
        )}
      </Field>
      <div />

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

      <Field name="default-value" label="Default Value" isDisabled={node.data.useDefaultValueInput}>
        {({ fieldProps }) => (
          <TextField
            {...fieldProps}
            value={node.data.defaultValue ? `${node.data.defaultValue}` : ''}
            onChange={(e) =>
              onChange?.({ ...node, data: { ...node.data, defaultValue: (e.target as HTMLInputElement).value } })
            }
          />
        )}
      </Field>
      <div className="use-input-toggle">
        <Toggle
          isChecked={node.data.useDefaultValueInput}
          onChange={(e) => onChange?.({ ...node, data: { ...node.data, useDefaultValueInput: e.target.checked } })}
        />
      </div>
    </div>
  );
};

export type GraphInputNodeOutputProps = {
  node: GraphInputNode;
};

export const GraphInputNodeOutput: FC<GraphInputNodeOutputProps> = ({ node }) => {
  const output = useRecoilValue(lastRunData(node.id));

  if (!output) {
    return null;
  }

  if (output.status?.type === 'error') {
    return <div>Error: {output.status.error}</div>;
  }

  if (!output.outputData) {
    return null;
  }

  const outputText = output.outputData['data' as PortId];

  return (
    <pre className="pre-wrap">
      <RenderDataValue value={outputText} />
    </pre>
  );
};

export const graphInputNodeDescriptor: NodeComponentDescriptor<'graphInput'> = {
  Body: GraphInputNodeBody,
  Output: GraphInputNodeOutput,
  Editor: GraphInputNodeEditor,
};
