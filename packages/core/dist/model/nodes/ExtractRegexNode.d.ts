import { ChartNode, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { NodeImpl } from '../NodeImpl';
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
    process(inputs: Record<PortId, DataValue>): Promise<Record<PortId, DataValue>>;
}
