import { ChartNode } from './NodeBase';
import { ConcatNode, ConcatNodeImpl } from './nodes/ConcatNode';
import { UserInputNode } from './nodes/UserInputNode';
import { NodeImpl } from './NodeImpl';

export type Nodes = ConcatNode | UserInputNode;

export const createNodeInstance = <T extends Nodes>(node: T): NodeImpl<ChartNode<string, unknown>> => {
  switch (node.type) {
    case 'concat':
      return new ConcatNodeImpl(node);
    // Add other node types here
    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
};
