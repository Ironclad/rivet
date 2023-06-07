import { SupportedModels } from './tokenizer';
export declare class OpenAIError extends Error {
    readonly status: number;
    readonly responseJson: any;
    constructor(status: number, responseJson: any);
}
export type ChatCompletionRole = 'system' | 'assistant' | 'user' | 'tool';
export type ChatCompletionRequestMessage = {
    role: ChatCompletionRole;
    /** The content of the message. */
    content: string;
    /** The target of the message. Only allowed if role = assistant. Null value indicates the user. If specified, must be a tool in the 'tools' section. */
    recipient?: {
        role: 'tool';
        name: string;
    } | null;
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
    tools?: {
        [name: string]: ChatCompletionTool | ChatCompletionToolNamespace;
    };
    /** Force-sets the recipient of the model response. Null means the recipient is the user. Auto means the model can pick the recipient.
     * If tools are not present, null is the default. If tools are present, 'auto' is the default.
     */
    recipient?: null | 'auto' | {
        role: 'tool';
        name: string;
    };
    /**
     * Specifies the response format of messages inside a choice. Particularly applicable when the model responds with more than one
     * message e.g. the first message says "Sure, let me look that up" and the second message calls a tool.
     */
    format?: 'list' | 'merged';
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
    recipient: {
        role: 'tool';
        name: string;
    } | null;
    content: string;
};
export type ChatCompletionResponseChoice = {
    index: number;
    finish_reason: 'stop' | 'length' | 'insufficient_tokens' | 'tool_message';
} & ({
    message: ChatCompletionResponseMessage;
} | {
    messages: ChatCompletionResponseMessage[];
} | {
    messages: ChatCompletionResponseMessage & {
        tool_call: string | null;
    };
});
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
        recipient?: {
            role?: 'tool';
            name?: string;
        };
        content?: string;
        tool_call?: string;
    };
    finish_reason: null | 'stop' | 'length' | 'insufficient_tokens' | 'tool_message';
};
export type ChatCompletionToolMap = Record<string, ChatCompletionTool | ChatCompletionToolNamespace>;
export type ChatCompletionTool = {
    type: 'tool';
    description: string;
    schema: object;
};
export type ChatCompletionToolNamespace = {
    type: 'namespace';
    description: string;
    tools: {
        [name: string]: ChatCompletionTool;
    };
};
export declare function streamChatCompletions({ auth, signal, ...rest }: ChatCompletionOptions): AsyncGenerator<ChatCompletionChunk>;
