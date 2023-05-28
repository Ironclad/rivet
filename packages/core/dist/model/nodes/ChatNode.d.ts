import { ChartNode, NodeConnection, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { InternalProcessContext, NodeImpl } from '../NodeImpl';
import { Inputs, Outputs } from '../GraphProcessor';
export type ChatNode = ChartNode<'chat', ChatNodeData>;
export type ChatNodeData = {
    model: string;
    useModelInput: boolean;
    temperature: number;
    useTemperatureInput: boolean;
    top_p: number;
    useTopPInput: boolean;
    useTopP: boolean;
    useUseTopPInput: boolean;
    maxTokens: number;
    useMaxTokensInput: boolean;
    useStop: boolean;
    stop: string;
    useStopInput: boolean;
    presencePenalty: number;
    usePresencePenaltyInput: boolean;
    frequencyPenalty: number;
    useFrequencyPenaltyInput: boolean;
    /** Given the same set of inputs, return the same output without hitting GPT */
    cache: boolean;
};
export declare class ChatNodeImpl extends NodeImpl<ChatNode> {
    static create(): ChatNode;
    getInputDefinitions(connections: NodeConnection[]): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs>;
}
