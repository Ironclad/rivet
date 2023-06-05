import { FC } from 'react';
import { LoopControllerNode, Outputs, PortId } from '@ironclad/nodai-core';
import { RenderDataValue } from '../RenderDataValue';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

type LoopControllerNodeBodyProps = {
  node: LoopControllerNode;
};

export const LoopControllerNodeBody: FC<LoopControllerNodeBodyProps> = ({ node }) => {
  return null;
};

export const LoopControllerNodeOutput: FC<{ outputs: Outputs }> = ({ outputs }) => {
  const outputKeys = Object.keys(outputs).filter((key) => key.startsWith('output'));

  const breakLoop = outputs['break' as PortId]!.type !== 'control-flow-excluded';

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
          <RenderDataValue key={key} value={outputs[key as PortId]} />
        </div>
      ))}
    </div>
  );
};

export const loopControllerNodeDescriptor: NodeComponentDescriptor<'loopController'> = {
  Body: LoopControllerNodeBody,
  OutputSimple: LoopControllerNodeOutput,
};
