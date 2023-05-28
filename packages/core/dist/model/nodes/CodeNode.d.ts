import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { NodeImpl } from '../NodeImpl';
import { DataValue } from '../DataValue';
export type CodeNode = ChartNode<'code', CodeNodeData>;
export type CodeNodeData = {
    code: string;
    inputNames: string;
    outputNames: string;
};
export declare class CodeNodeImpl extends NodeImpl<CodeNode> {
    static create(code?: string, inputNames?: string, outputNames?: string): CodeNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    process(inputs: Record<string, DataValue>): Promise<Record<string, DataValue>>;
}
