import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { NodeImpl } from '../NodeImpl';
import { DataValue } from '../DataValue';
export type PromptNode = ChartNode<'prompt', PromptNodeData>;
export type PromptNodeData = {
    type: 'system' | 'user' | 'assistant';
    useTypeInput: boolean;
    promptText: string;
};
export declare class PromptNodeImpl extends NodeImpl<PromptNode> {
    static create(promptText?: string): PromptNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    interpolate(baseString: string, values: Record<string, string>): string;
    process(inputs: Record<string, DataValue>): Promise<Record<string, DataValue>>;
}
