import { NodeImpl } from '../NodeImpl';
import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { Inputs, Outputs } from '../GraphProcessor';
export type IfNode = ChartNode<'if', IfNodeData>;
export type IfNodeData = {};
export declare class IfNodeImpl extends NodeImpl<IfNode> {
    static create: () => IfNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    process(inputData: Inputs): Promise<Outputs>;
}
export declare const ifNode: import("../NodeImpl").NodeDefinition<IfNode>;
