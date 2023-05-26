import { FC } from 'react';
import { useRecoilValue } from 'recoil';
import { lastRunData } from '../../state/dataFlow';
import { RenderDataValue } from '../RenderDataValue';
import { PassthroughNode } from '@ironclad/nodai-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export type PassthroughNodeBodyProps = { node: PassthroughNode };

export const PassthroughNodeBody: FC<PassthroughNodeBodyProps> = () => {
  return null;
};

export const PassthroughNodeEditor: FC<PassthroughNodeBodyProps> = () => {
  return null;
};

export const PassthroughNodeOutput: FC<PassthroughNodeBodyProps> = ({ node }) => {
  const output = useRecoilValue(lastRunData(node.id));

  if (!output) {
    return null;
  }

  if (output.status?.type === 'error') {
    return <div>{output.status.error}</div>;
  }

  if (!output.outputData) {
    return null;
  }

  const outputs = Object.entries(output.outputData)
    .filter(([key]) => key.startsWith('output'))
    .map(([, value]) => value);

  return (
    <div>
      {outputs.map((outputData, index) => (
        <div>
          <div>
            <em>Output {index + 1}</em>
          </div>
          <RenderDataValue key={index} value={outputData} />
        </div>
      ))}
    </div>
  );
};

export const passthroughNodeDescriptor: NodeComponentDescriptor<'passthrough'> = {
  Body: PassthroughNodeBody,
  Output: PassthroughNodeOutput,
  Editor: PassthroughNodeEditor,
};
