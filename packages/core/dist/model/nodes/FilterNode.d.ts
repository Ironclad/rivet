import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { NodeImpl } from '../NodeImpl';
import { Inputs, Outputs } from '../GraphProcessor';
export type FilterNode = ChartNode<'filter', FilterNodeData>;
export type FilterNodeData = {};
export declare class FilterNodeImpl extends NodeImpl<FilterNode> {
    static create(): FilterNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    process(inputs: Inputs): Promise<Outputs>;
}
export declare const filterNode: import("../NodeImpl").NodeDefinition<FilterNode>;
