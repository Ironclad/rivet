import { FC } from 'react';
import { GraphOutputNode } from '@ironclad/nodai-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export type GraphOutputNodeBodyProps = {
  node: GraphOutputNode;
};

export const GraphOutputNodeBody: FC<GraphOutputNodeBodyProps> = ({ node }) => {
  return (
    <div>
      <h3>{node.data.id}</h3>
      <p>Type: {node.data.dataType}</p>
    </div>
  );
};

export const graphOutputNodeDescriptor: NodeComponentDescriptor<'graphOutput'> = {
  Body: GraphOutputNodeBody,
};
