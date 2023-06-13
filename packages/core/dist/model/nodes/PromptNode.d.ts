import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl } from '../NodeImpl';
import { Inputs, Outputs } from '../..';
export type PromptNode = ChartNode<'prompt', PromptNodeData>;
export type PromptNodeData = {
    type: 'system' | 'user' | 'assistant' | 'tool';
    useTypeInput: boolean;
    promptText: string;
    name?: string;
    useNameInput?: boolean;
};
export declare class PromptNodeImpl extends NodeImpl<PromptNode> {
    static create(promptText?: string): PromptNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    getEditors(): EditorDefinition<PromptNode>[];
    interpolate(baseString: string, values: Record<string, string>): string;
    process(inputs: Inputs): Promise<Outputs>;
}
export declare const promptNode: import("../NodeImpl").NodeDefinition<PromptNode>;
