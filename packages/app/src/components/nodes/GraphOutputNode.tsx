import { FC } from 'react';
import { css } from '@emotion/react';
import { Field } from '@atlaskit/form';
import Select from '@atlaskit/select';
import TextField from '@atlaskit/textfield';
import Checkbox from '@atlaskit/checkbox';
import { useRecoilValue } from 'recoil';
import { lastRunData } from '../../state/dataFlow';
import { RenderDataValue } from '../RenderDataValue';
import { DataType, GraphOutputNode, PortId, ScalarType, dataTypeDisplayNames, scalarTypes } from '@ironclad/nodai-core';

export type GraphOutputNodeBodyProps = {
  node: GraphOutputNode;
};

export const GraphOutputNodeBody: FC<GraphOutputNodeBodyProps> = ({ node }) => {
  return (
    <div>
      <h3>{node.data.id}</h3>
      <p>Type: {node.data.dataType}</p>
    </div>
  );
};

export type GraphOutputNodeEditorProps = {
  node: GraphOutputNode;
  onChange?: (node: GraphOutputNode) => void;
};

const editorCss = css`
  display: grid;
  grid-template-columns: 1fr;
  align-items: stretch;
  width: 100%;
  align-content: start;
  align-items: center;
  column-gap: 16px;
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

export const GraphOutputNodeEditor: FC<GraphOutputNodeEditorProps> = ({ node, onChange }) => {
  const graphOutputNode = node as GraphOutputNode;

  const scalarType = graphOutputNode.data.dataType.replace('[]', '') as ScalarType;
  const isArray = graphOutputNode.data.dataType.endsWith('[]');

  const dataTypeOptions = validTypes.map((type) => ({
    label: dataTypeDisplayNames[type],
    value: type,
  }));

  const selectedOption = dataTypeOptions.find((option) => option.value === graphOutputNode.data.dataType);

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
    </div>
  );
};
export type GraphOutputNodeOutputProps = {
  node: GraphOutputNode;
};

export const GraphOutputNodeOutput: FC<GraphOutputNodeOutputProps> = ({ node }) => {
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

  const outputText = output.outputData?.['value' as PortId];

  return (
    <pre className="pre-wrap">
      <RenderDataValue value={outputText} />
    </pre>
  );
};
