import { type FC } from 'react';
import { useAtomValue } from 'jotai';
import { projectState } from '../../state/savedGraphs.js';
import { type Outputs, type PortId, type SubGraphNode, coerceTypeOptional, type DataValue } from '@ironclad/rivet-core';
import { type NodeComponentDescriptor } from '../../hooks/useNodeTypes.js';
import { RenderDataOutputs } from '../RenderDataValue.js';
import { omit } from 'lodash-es';
import { type InputsOrOutputsWithRefs } from '../../state/dataFlow';

export const SubGraphNodeBody: FC<{
  node: SubGraphNode;
}> = ({ node }) => {
  const project = useAtomValue(projectState);
  const selectedGraph = project.graphs[node.data.graphId];
  const selectedGraphName = selectedGraph?.metadata?.name ?? node.data.graphId;

  return (
    <div>
      <div>{selectedGraphName}</div>
    </div>
  );
};

export const SubGraphNodeOutputSimple: FC<{
  outputs: InputsOrOutputsWithRefs;
  renderMarkdown?: boolean;
  isCompact: boolean;
}> = ({ outputs, renderMarkdown, isCompact }) => {
  const cost = coerceTypeOptional(outputs['cost' as PortId] as DataValue, 'number');
  const duration = coerceTypeOptional(outputs['duration' as PortId] as DataValue, 'number');

  return (
    <div>
      <div className="metaInfo">
        {(cost ?? 0) > 0 && (
          <div>
            <em>${cost!.toFixed(3)}</em>
          </div>
        )}
        {(duration ?? 0) > 0 && (
          <div>
            <em>Duration: {duration}ms</em>
          </div>
        )}
      </div>
      <div>
        <RenderDataOutputs
          outputs={omit(outputs, ['cost', 'duration'])! as InputsOrOutputsWithRefs}
          renderMarkdown={renderMarkdown}
          isCompact={isCompact}
        />
      </div>
    </div>
  );
};

export const FullscreenSubGraphNodeOutputSimple: FC<{
  outputs: InputsOrOutputsWithRefs;
  renderMarkdown: boolean;
}> = ({ outputs, renderMarkdown }) => {
  return <SubGraphNodeOutputSimple outputs={outputs} renderMarkdown={renderMarkdown} isCompact={false} />;
};

export const subgraphNodeDescriptor: NodeComponentDescriptor<'subGraph'> = {
  Body: SubGraphNodeBody,
  OutputSimple: SubGraphNodeOutputSimple,
  FullscreenOutputSimple: FullscreenSubGraphNodeOutputSimple,
};
