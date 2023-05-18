import { FC } from 'react';
import { LoopControllerNode, PortId } from '@ironclad/nodai-core';
import { useRecoilValue } from 'recoil';
import { lastRunData } from '../../state/dataFlow';
import { RenderDataValue } from '../RenderDataValue';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

type LoopControllerNodeBodyProps = {
  node: LoopControllerNode;
};

export const LoopControllerNodeBody: FC<LoopControllerNodeBodyProps> = ({ node }) => {
  return null;
};

export const LoopControllerNodeOutput: FC<{ node: LoopControllerNode }> = ({ node }) => {
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

  const outputKeys = Object.keys(output.outputData).filter((key) => key.startsWith('output'));

  const breakLoop = output.outputData['break' as PortId]!.type !== 'control-flow-excluded';

  return (
    <div>
      <div key="break">
        <em>Continue:</em>
        {breakLoop ? 'false' : 'true'}
      </div>
      {outputKeys.map((key, i) => (
        <div key={key}>
          <div>
            <em>Output {i + 1}</em>
          </div>
          <RenderDataValue key={key} value={output.outputData![key as PortId]} />
        </div>
      ))}
    </div>
  );
};
export const loopControllerNodeDescriptor: NodeComponentDescriptor<'loopController'> = {
  Body: LoopControllerNodeBody,
  Output: LoopControllerNodeOutput,
  Editor: undefined,
};
