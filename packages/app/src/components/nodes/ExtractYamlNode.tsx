import { FC } from 'react';
import { ExtractYamlNode, PortId } from '@ironclad/nodai-core';
import { RenderDataValue } from '../RenderDataValue';
import { useRecoilValue } from 'recoil';
import { lastRunData } from '../../state/dataFlow';

export type ExtractYamlNodeBodyProps = {
  node: ExtractYamlNode;
};

export const ExtractYamlNodeBody: FC<ExtractYamlNodeBodyProps> = () => {
  return <div>Extract YAML</div>;
};

export type ExtractYamlNodeEditorProps = {
  node: ExtractYamlNode;
  onChange?: (node: ExtractYamlNode) => void;
};

export const ExtractYamlNodeEditor: FC<ExtractYamlNodeEditorProps> = () => {
  return <div>No settings available for this node.</div>;
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
