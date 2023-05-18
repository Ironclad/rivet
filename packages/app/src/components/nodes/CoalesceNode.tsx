import { FC } from 'react';
import { useRecoilValue } from 'recoil';
import { lastRunData } from '../../state/dataFlow';
import { RenderDataValue } from '../RenderDataValue';
import { CoalesceNode, PortId } from '@ironclad/nodai-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export type CoalesceNodeBodyProps = { node: CoalesceNode };

export const CoalesceNodeBody: FC<CoalesceNodeBodyProps> = () => {
  return null;
};

export const CoalesceNodeEditor: FC<CoalesceNodeBodyProps> = () => {
  return null;
};

export const CoalesceNodeOutput: FC<CoalesceNodeBodyProps> = ({ node }) => {
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

  const outputData = output.outputData?.['output' as PortId];

  return (
    <div>
      <RenderDataValue value={outputData} />
    </div>
  );
};

export const coalesceNodeDescriptor: NodeComponentDescriptor<'coalesce'> = {
  Body: CoalesceNodeBody,
  Output: CoalesceNodeOutput,
  Editor: CoalesceNodeEditor,
};
