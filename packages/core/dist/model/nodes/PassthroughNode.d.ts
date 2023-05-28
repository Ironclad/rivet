import { NodeImpl } from '../NodeImpl';
import { ChartNode, NodeConnection, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { Inputs, Outputs } from '../GraphProcessor';
export type PassthroughNode = ChartNode<'passthrough', PassthroughNodeData>;
export type PassthroughNodeData = {};
export declare class PassthroughNodeImpl extends NodeImpl<ChartNode> {
    #private;
    static create: () => PassthroughNode;
    getInputDefinitions(connections: NodeConnection[]): NodeInputDefinition[];
    getOutputDefinitions(connections: NodeConnection[]): NodeOutputDefinition[];
    process(inputData: Inputs): Promise<Outputs>;
}
