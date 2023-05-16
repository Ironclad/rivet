import { FC } from 'react';
import { ChartNode, ExternalCallNode } from '@ironclad/nodai-core';
import Toggle from '@atlaskit/toggle';
import TextField from '@atlaskit/textfield';
import { useRecoilValue } from 'recoil';
import { lastRunData } from '../../state/dataFlow';
import { RenderDataValue } from '../RenderDataValue';

export type ExternalCallNodeBodyProps = {
  node: ExternalCallNode;
};

export const ExternalCallNodeBody: FC<ExternalCallNodeBodyProps> = ({ node }) => {
  return <div>{node.data.useFunctionNameInput ? '(Using Input)' : node.data.functionName}</div>;
};

export type ExternalCallNodeOutputProps = {
  node: ExternalCallNode;
};

export const ExternalCallNodeOutput: FC<ExternalCallNodeOutputProps> = ({ node }) => {
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

  const outputValues = Object.entries(output.outputData).map(([key, value]) => (
    <pre className="pre-wrap" key={key}>
      {key}: <RenderDataValue value={value} />
    </pre>
  ));

  return <pre>{outputValues}</pre>;
};

type ExternalCallNodeEditorProps = {
  node: ExternalCallNode;
  onChange?: (node: ChartNode<'externalCall', ExternalCallNode['data']>) => void;
};

export const ExternalCallNodeEditor: FC<ExternalCallNodeEditorProps> = ({ node, onChange }) => {
  const handleFunctionNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.({
      ...node,
      data: { ...node.data, functionName: e.target.value },
    });
  };

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.({
      ...node,
      data: { ...node.data, useFunctionNameInput: e.target.checked },
    });
  };

  return (
    <div>
      <div>
        <label htmlFor="functionName">Function Name:</label>
        <TextField
          id="functionName"
          value={node.data.functionName}
          onChange={handleFunctionNameChange}
          isDisabled={node.data.useFunctionNameInput}
        />
      </div>
      <div>
        <label htmlFor="useFunctionNameInput">Use Function Name Input:</label>
        <Toggle id="useFunctionNameInput" isChecked={node.data.useFunctionNameInput} onChange={handleToggleChange} />
      </div>
    </div>
  );
};
