import { FC } from 'react';
import { ChartNode, ExtractObjectPathNode } from '@ironclad/nodai-core';
import Toggle from '@atlaskit/toggle';
import TextField from '@atlaskit/textfield';
import { useRecoilValue } from 'recoil';
import { lastRunData } from '../../state/dataFlow';
import { RenderDataValue } from '../RenderDataValue';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export type ExtractObjectPathNodeBodyProps = {
  node: ExtractObjectPathNode;
};

export const ExtractObjectPathNodeBody: FC<ExtractObjectPathNodeBodyProps> = ({ node }) => {
  return <div>{node.data.usePathInput ? '(Using Input)' : node.data.path}</div>;
};

export type ExtractObjectPathNodeOutputProps = {
  node: ExtractObjectPathNode;
};

export const ExtractObjectPathNodeOutput: FC<ExtractObjectPathNodeOutputProps> = ({ node }) => {
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

type ExtractObjectPathNodeEditorProps = {
  node: ExtractObjectPathNode;
  onChange?: (node: ChartNode<'extractObjectPath', ExtractObjectPathNode['data']>) => void;
};

export const ExtractObjectPathNodeEditor: FC<ExtractObjectPathNodeEditorProps> = ({ node, onChange }) => {
  const handleFunctionNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.({
      ...node,
      data: { ...node.data, path: e.target.value },
    });
  };

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.({
      ...node,
      data: { ...node.data, usePathInput: e.target.checked },
    });
  };

  return (
    <div>
      <div>
        <label htmlFor="path">Path:</label>
        <TextField
          id="path"
          value={node.data.path}
          onChange={handleFunctionNameChange}
          isDisabled={node.data.usePathInput}
        />
      </div>
      <div>
        <label htmlFor="usePathInput">Use Path Input:</label>
        <Toggle id="usePathInput" isChecked={node.data.usePathInput} onChange={handleToggleChange} />
      </div>
    </div>
  );
};

export const extractObjectPathNodeDescriptor: NodeComponentDescriptor<'extractObjectPath'> = {
  Body: ExtractObjectPathNodeBody,
  Output: ExtractObjectPathNodeOutput,
  Editor: ExtractObjectPathNodeEditor,
};
