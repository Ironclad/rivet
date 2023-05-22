import { FC } from 'react';
import { ExtractYamlNode, PortId } from '@ironclad/nodai-core';
import { RenderDataValue } from '../RenderDataValue';
import { useRecoilValue } from 'recoil';
import { lastRunData } from '../../state/dataFlow';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';
import TextField from '@atlaskit/textfield';

export type ExtractYamlNodeBodyProps = {
  node: ExtractYamlNode;
};

export const ExtractYamlNodeBody: FC<ExtractYamlNodeBodyProps> = ({ node }) => {
  return (
    <div>
      <div>Root: {node.data.rootPropertyName}</div>
      {node.data.objectPath && <div>Path: {node.data.objectPath}</div>}
    </div>
  );
};

export const ExtractYamlNodeOutput = ({ node }: { node: ExtractYamlNode }) => {
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

  if (output.outputData['output' as PortId]?.type === 'control-flow-excluded') {
    return null;
  }

  if (output.outputData['output' as PortId]?.type === 'object[]') {
    return <div>TODO</div>;
  }

  return (
    <div>
      <RenderDataValue value={output.outputData['output' as PortId]} />
    </div>
  );
};

type ExtractYamlNodeEditorProps = {
  node: ExtractYamlNode;
  onChange?: (node: ExtractYamlNode) => void;
};

export const ExtractYamlNodeEditor: FC<ExtractYamlNodeEditorProps> = ({ node, onChange }) => {
  const handleRootPropertyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.({
      ...node,
      data: { ...node.data, rootPropertyName: e.target.value },
    });
  };

  const handleFunctionNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.({
      ...node,
      data: { ...node.data, objectPath: e.target.value },
    });
  };

  return (
    <div>
      <div>
        <label htmlFor="rootProperty">Root Property:</label>
        <TextField id="rootProperty" value={node.data.rootPropertyName} onChange={handleRootPropertyNameChange} />
      </div>
      <div>
        <label htmlFor="path">Extract Path:</label>
        <TextField id="path" value={node.data.objectPath ?? ''} onChange={handleFunctionNameChange} />
      </div>
    </div>
  );
};

export const extractYamlNodeDescriptor: NodeComponentDescriptor<'extractYaml'> = {
  Body: ExtractYamlNodeBody,
  Output: ExtractYamlNodeOutput,
  Editor: ExtractYamlNodeEditor,
};
