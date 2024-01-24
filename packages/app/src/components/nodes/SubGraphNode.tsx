import { type FC } from 'react';
import { useRecoilValue } from 'recoil';
import { projectState } from '../../state/savedGraphs.js';
import { type Outputs, type PortId, type SubGraphNode, coerceTypeOptional } from '@ironclad/rivet-core';
import { type NodeComponentDescriptor } from '../../hooks/useNodeTypes.js';
import { RenderDataOutputs } from '../RenderDataValue.js';
import { omit } from 'lodash-es';

export const SubGraphNodeBody: FC<{
  node: SubGraphNode;
}> = ({ node }) => {
  const project = useRecoilValue(projectState);
  const selectedGraph = project.graphs[node.data.graphId];
  const selectedGraphName = selectedGraph?.metadata?.name ?? node.data.graphId;

  return (
    <div>
      <div>{selectedGraphName}</div>
    </div>
  );
};

export const SubGraphNodeOutputSimple: FC<{
  outputs: Outputs;
  renderMarkdown?: boolean;
}> = ({ outputs, renderMarkdown }) => {
  const cost = coerceTypeOptional(outputs['cost' as PortId], 'number');
  const duration = coerceTypeOptional(outputs['duration' as PortId], 'number');

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
        <RenderDataOutputs outputs={omit(outputs, ['cost', 'duration'])!} renderMarkdown={renderMarkdown} />
      </div>
    </div>
  );
};

export const FullscreenSubGraphNodeOutputSimple: FC<{
  outputs: Outputs;
  renderMarkdown: boolean;
}> = ({ outputs, renderMarkdown }) => {
  return <SubGraphNodeOutputSimple outputs={outputs} renderMarkdown={renderMarkdown} />;
};

export const subgraphNodeDescriptor: NodeComponentDescriptor<'subGraph'> = {
  Body: SubGraphNodeBody,
  OutputSimple: SubGraphNodeOutputSimple,
  FullscreenOutputSimple: FullscreenSubGraphNodeOutputSimple,
};
