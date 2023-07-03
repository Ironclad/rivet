import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl } from '../NodeImpl';
import { DataValue } from '../DataValue';
export type GptFunctionNode = ChartNode<'gptFunction', GptFunctionNodeData>;
export type GptFunctionNodeData = {
    name: string;
    description: string;
    schema: string;
};
export declare class GptFunctionNodeImpl extends NodeImpl<GptFunctionNode> {
    static create(): GptFunctionNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    getEditors(): EditorDefinition<GptFunctionNode>[];
    process(inputs: Record<string, DataValue>): Promise<Record<string, DataValue>>;
}
export declare const gptFunctionNode: import("../NodeImpl").NodeDefinition<GptFunctionNode>;
