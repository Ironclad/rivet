import { FC } from 'react';
import { ExtractJsonNode, PortId } from '@ironclad/nodai-core';
import { RenderDataValue } from '../RenderDataValue';
import { useRecoilValue } from 'recoil';
import { lastRunData } from '../../state/dataFlow';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export type ExtractJsonNodeBodyProps = {
  node: ExtractJsonNode;
};

export const ExtractJsonNodeBody: FC<ExtractJsonNodeBodyProps> = () => {
  return <div>Extract JSON</div>;
};

export type ExtractJsonNodeEditorProps = {
  node: ExtractJsonNode;
  onChange?: (node: ExtractJsonNode) => void;
};

export const ExtractJsonNodeEditor: FC<ExtractJsonNodeEditorProps> = () => {
  return <div>No settings available for this node.</div>;
};

export const ExtractJsonNodeOutput = ({ node }: { node: ExtractJsonNode }) => {
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

export const extractJsonNodeDescriptor: NodeComponentDescriptor<'extractJson'> = {
  Body: ExtractJsonNodeBody,
  Output: ExtractJsonNodeOutput,
  Editor: ExtractJsonNodeEditor,
};
