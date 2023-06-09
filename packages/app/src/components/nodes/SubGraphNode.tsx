import { FC } from 'react';
import { useRecoilValue } from 'recoil';
import { projectState } from '../../state/savedGraphs';
import { SubGraphNode } from '@ironclad/rivet-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

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

export const subgraphNodeDescriptor: NodeComponentDescriptor<'subGraph'> = {
  Body: SubGraphNodeBody,
};
