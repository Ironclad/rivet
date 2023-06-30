import { SupportedModels } from './tokenizer';
export declare class OpenAIError extends Error {
    readonly status: number;
    readonly responseJson: any;
    constructor(status: number, responseJson: any);
}
export type ChatCompletionRole = 'system' | 'assistant' | 'user' | 'function';
export type ChatCompletionRequestMessage = {
    role: ChatCompletionRole;
    /** The content of the message. */
    content: string;
    function_call?: object;
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
    functions?: ChatCompletionFunction[];
};
export type ChatCompletionResponse = {
    id: string;
    object: 'text_completion';
    created: number;
    model: string;
    choices: ChatCompletionResponseChoice[];
};
export type ChatCompletionResponseMessage = {
    role: ChatCompletionRole;
    content: string;
    function_call?: object;
};
export type ChatCompletionResponseChoice = {
    index: number;
    finish_reason: 'stop' | 'length' | 'insufficient_tokens' | 'function_call';
    message: ChatCompletionResponseMessage;
};
export type ChatCompletionChunk = {
    object: 'chat.completion.chunk';
    created: number;
    model: string;
    choices: ChatCompletionChunkChoice[];
};
export type ChatCompletionChunkChoice = {
    index: number;
    message_index: number;
    delta: {
        role?: 'assistant';
        content?: string;
        function_call?: object;
    };
    finish_reason: null | 'stop' | 'length' | 'insufficient_tokens' | 'function_call';
};
export type ChatCompletionFunction = {
    name: string;
    description: string;
    parameters: object;
};
export declare function streamChatCompletions({ auth, signal, ...rest }: ChatCompletionOptions): AsyncGenerator<ChatCompletionChunk>;
