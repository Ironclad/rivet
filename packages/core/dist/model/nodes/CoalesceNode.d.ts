import { NodeImpl } from '../NodeImpl';
import { ChartNode, NodeConnection, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { Inputs, Outputs } from '../GraphProcessor';
export type CoalesceNode = ChartNode<'coalesce', CoalesceNodeData>;
export type CoalesceNodeData = {};
export declare class CoalesceNodeImpl extends NodeImpl<CoalesceNode> {
    #private;
    static create: () => CoalesceNode;
    getInputDefinitions(connections: NodeConnection[]): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    process(inputData: Inputs): Promise<Outputs>;
}
export declare const coalesceNode: import("../NodeImpl").NodeDefinition<CoalesceNode>;
