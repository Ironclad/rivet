import { FC } from 'react';
import { GraphInputNode } from '@ironclad/nodai-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export type GraphInputNodeBodyProps = {
  node: GraphInputNode;
};

export const GraphInputNodeBody: FC<GraphInputNodeBodyProps> = ({ node }) => {
  return (
    <div>
      <h3>{node.data.id}</h3>
      <p>Type: {node.data.dataType}</p>
    </div>
  );
};

export const graphInputNodeDescriptor: NodeComponentDescriptor<'graphInput'> = {
  Body: GraphInputNodeBody,
};
