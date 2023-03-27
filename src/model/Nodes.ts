import { ChartNode, NodeId } from './NodeBase';
import { ConcatNode, ConcatNodeImpl } from './nodes/ConcatNode';
import { UserInputNode, UserInputNodeImpl } from './nodes/UserInputNode';
import { NodeImpl } from './NodeImpl';
import { BranchNode, BranchNodeImpl } from './nodes/BranchNode';
import { InterpolateNode, InterpolateNodeImpl } from './nodes/InterpolateNode';
import { ChatNode, ChatNodeImpl } from './nodes/ChatNode';

export type Nodes = ConcatNode | UserInputNode | BranchNode | InterpolateNode | ChatNode;

export type NodeType = Nodes['type'];

export const createNodeInstance = <T extends Nodes>(node: T): NodeImpl<ChartNode<string, unknown>> => {
  switch (node.type) {
    case 'concat':
      return new ConcatNodeImpl(node);
    // Add other node types here
    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
};

export function nodeFactory(type: NodeType): Nodes {
  switch (type) {
    case 'concat':
      return ConcatNodeImpl.create();
    case 'userInput':
      return UserInputNodeImpl.create();
    case 'branch':
      return BranchNodeImpl.create();
    case 'interpolate':
      return InterpolateNodeImpl.create();
    case 'chat':
      return ChatNodeImpl.create();
    default:
      throw new Error(`Unknown node type: ${type}`);
  }
}
