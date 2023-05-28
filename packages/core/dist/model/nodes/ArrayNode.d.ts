import { ChartNode, NodeConnection, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { NodeImpl } from '../NodeImpl';
import { Inputs, Outputs } from '../GraphProcessor';
export type ArrayNode = ChartNode<'array', ArrayNodeData>;
export type ArrayNodeData = {};
export declare class ArrayNodeImpl extends NodeImpl<ArrayNode> {
    #private;
    static create(): ArrayNode;
    getInputDefinitions(connections: NodeConnection[]): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    process(inputs: Inputs): Promise<Outputs>;
}
