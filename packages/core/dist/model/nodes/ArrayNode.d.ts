import { ChartNode, NodeConnection, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl } from '../NodeImpl';
import { Inputs, Outputs } from '../GraphProcessor';
export type ArrayNode = ChartNode<'array', ArrayNodeData>;
export type ArrayNodeData = {
    flatten?: boolean;
    flattenDeep?: boolean;
};
export declare class ArrayNodeImpl extends NodeImpl<ArrayNode> {
    #private;
    static create(): ArrayNode;
    getInputDefinitions(connections: NodeConnection[]): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    getEditors(): EditorDefinition<ArrayNode>[];
    process(inputs: Inputs): Promise<Outputs>;
}
export declare const arrayNode: import("../NodeImpl").NodeDefinition<ArrayNode>;
