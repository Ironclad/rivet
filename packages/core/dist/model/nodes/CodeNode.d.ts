import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl } from '../NodeImpl';
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
    getEditors(): EditorDefinition<CodeNode>[];
    process(inputs: Record<string, DataValue>): Promise<Record<string, DataValue>>;
}
export declare const codeNode: import("../NodeImpl").NodeDefinition<CodeNode>;
