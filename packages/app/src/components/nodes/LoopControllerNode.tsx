import { type FC } from 'react';
import { type Outputs, type PortId } from '@ironclad/rivet-core';
import { RenderDataValue } from '../RenderDataValue.js';
import { type NodeComponentDescriptor } from '../../hooks/useNodeTypes.js';
import { type InputsOrOutputsWithRefs, type DataValueWithRefs } from '../../state/dataFlow';

export const LoopControllerNodeOutput: FC<{ outputs: InputsOrOutputsWithRefs; renderMarkdown?: boolean }> = ({
  outputs,
}) => {
  const outputKeys = Object.keys(outputs).filter((key) => key.startsWith('output'));

  const breakLoop = outputs['break' as PortId] != null && outputs['break' as PortId]!.type !== 'control-flow-excluded';

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
          <RenderDataValue key={key} value={outputs[key as PortId] as DataValueWithRefs} />
        </div>
      ))}
    </div>
  );
};

export const loopControllerNodeDescriptor: NodeComponentDescriptor<'loopController'> = {
  OutputSimple: LoopControllerNodeOutput,
};
