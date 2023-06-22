import { ChartNode, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl } from '../NodeImpl';
import { DataValue } from '../DataValue';
export type ExtractRegexNode = ChartNode<'extractRegex', ExtractRegexNodeData>;
export type ExtractRegexNodeData = {
    regex: string;
    useRegexInput: boolean;
    errorOnFailed: boolean;
};
export declare class ExtractRegexNodeImpl extends NodeImpl<ExtractRegexNode> {
    static create(regex?: string): ExtractRegexNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    getEditors(): EditorDefinition<ExtractRegexNode>[];
    process(inputs: Record<PortId, DataValue>): Promise<Record<PortId, DataValue>>;
}
export declare const extractRegexNode: import("../NodeImpl").NodeDefinition<ExtractRegexNode>;
