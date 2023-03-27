import { ChartNode, NodeConnection } from './NodeBase';

export interface NodeGraph {
  nodes: ChartNode<string, unknown>[];
  connections: NodeConnection[];
}
