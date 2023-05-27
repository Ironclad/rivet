import { FC } from 'react';
import { ChartNode, ExternalCallNode, ExternalCallNodeData } from '@ironclad/nodai-core';
import Toggle from '@atlaskit/toggle';
import TextField from '@atlaskit/textfield';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export type ExternalCallNodeBodyProps = {
  node: ExternalCallNode;
};

export const ExternalCallNodeBody: FC<ExternalCallNodeBodyProps> = ({ node }) => {
  return <div>{node.data.useFunctionNameInput ? '(Using Input)' : node.data.functionName}</div>;
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

  const handleToggleChange = (param: keyof ExternalCallNodeData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.({
      ...node,
      data: { ...node.data, [param]: e.target.checked },
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
        <Toggle
          id="useFunctionNameInput"
          isChecked={node.data.useFunctionNameInput}
          onChange={handleToggleChange('useFunctionNameInput')}
        />
      </div>
      <div>
        <label htmlFor="useErrorOutput">Use Error Output:</label>
        <Toggle
          id="useErrorOutput"
          isChecked={node.data.useErrorOutput}
          onChange={handleToggleChange('useErrorOutput')}
        />
      </div>
    </div>
  );
};

export const externalCallNodeDescriptor: NodeComponentDescriptor<'externalCall'> = {
  Body: ExternalCallNodeBody,
  Output: undefined,
  Editor: ExternalCallNodeEditor,
};
