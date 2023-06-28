import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl } from '../NodeImpl';
import { ChatMessage } from '../DataValue';
import { Inputs, Outputs } from '../GraphProcessor';
import { InternalProcessContext } from '../ProcessContext';
export type ChatNode = ChartNode<'chat', ChatNodeData>;
export type ChatNodeConfigData = {
    model: string;
    temperature: number;
    useTopP: boolean;
    top_p?: number;
    maxTokens: number;
    stop?: string;
    presencePenalty?: number;
    frequencyPenalty?: number;
    enableFunctionUse?: boolean;
    user?: string;
    numberOfChoices?: number;
};
export type ChatNodeData = ChatNodeConfigData & {
    useModelInput: boolean;
    useTemperatureInput: boolean;
    useTopPInput: boolean;
    useTopP: boolean;
    useUseTopPInput: boolean;
    useMaxTokensInput: boolean;
    useStop: boolean;
    useStopInput: boolean;
    usePresencePenaltyInput: boolean;
    useFrequencyPenaltyInput: boolean;
    useUserInput?: boolean;
    useNumberOfChoicesInput?: boolean;
    /** Given the same set of inputs, return the same output without hitting GPT */
    cache: boolean;
};
export declare class ChatNodeImpl extends NodeImpl<ChatNode> {
    static create(): ChatNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    getEditors(): EditorDefinition<ChatNode>[];
    process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs>;
}
export declare const chatNode: import("../NodeImpl").NodeDefinition<ChatNode>;
export declare function getChatNodeMessages(inputs: Inputs): {
    messages: ChatMessage[];
    systemPrompt: import("../DataValue").DataValue | undefined;
};
