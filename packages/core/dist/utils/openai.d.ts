import { SupportedModels } from './tokenizer';
export declare class OpenAIError extends Error {
    readonly status: number;
    readonly responseJson: any;
    constructor(status: number, responseJson: any);
}
export type ChatCompletionRequestMessage = {
    role: 'system' | 'assistant' | 'user';
    content: string;
};
export type ChatCompletionOptions = {
    auth: {
        apiKey: string;
        organization?: string;
    };
    signal?: AbortSignal;
    model: SupportedModels;
    messages: ChatCompletionRequestMessage[];
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
    n?: number;
    stop?: string | string[];
    presence_penalty?: number;
    frequency_penalty?: number;
    logit_bias?: {
        [key: number]: number;
    };
};
export declare function streamChatCompletions({ auth, signal, model, messages, temperature, top_p, max_tokens, n, stop, presence_penalty, frequency_penalty, logit_bias, }: ChatCompletionOptions): AsyncGenerator<string>;
