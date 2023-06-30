import { TiktokenModel } from '@dqbd/tiktoken';
import { ChatCompletionRequestMessage } from './openai';
export declare const openaiModels: {
    'gpt-4': {
        maxTokens: number;
        tiktokenModel: "gpt-4";
        cost: {
            prompt: number;
            completion: number;
        };
        displayName: string;
    };
    'gpt-4-32k': {
        maxTokens: number;
        tiktokenModel: "gpt-4-32k";
        cost: {
            prompt: number;
            completion: number;
        };
        displayName: string;
    };
    'gpt-4-0613': {
        maxTokens: number;
        tiktokenModel: "gpt-4";
        cost: {
            prompt: number;
            completion: number;
        };
        displayName: string;
    };
    'gpt-4-32k-0613': {
        maxTokens: number;
        tiktokenModel: "gpt-4";
        cost: {
            prompt: number;
            completion: number;
        };
        displayName: string;
    };
    'gpt-3.5-turbo': {
        maxTokens: number;
        tiktokenModel: "gpt-3.5-turbo";
        cost: {
            prompt: number;
            completion: number;
        };
        displayName: string;
    };
    'gpt-3.5-turbo-0613': {
        maxTokens: number;
        tiktokenModel: "gpt-3.5-turbo";
        cost: {
            prompt: number;
            completion: number;
        };
        displayName: string;
    };
    'gpt-3.5-turbo-16k-0613': {
        maxTokens: number;
        tiktokenModel: "gpt-3.5-turbo";
        cost: {
            prompt: number;
            completion: number;
        };
        displayName: string;
    };
};
export declare const supportedModels: ("gpt-4" | "gpt-4-32k" | "gpt-3.5-turbo" | "gpt-4-0613" | "gpt-4-32k-0613" | "gpt-3.5-turbo-0613" | "gpt-3.5-turbo-16k-0613")[];
export type SupportedModels = keyof typeof openaiModels;
export declare function getTokenCountForString(input: string, model: TiktokenModel): number;
export declare function getTokenCountForMessages(messages: ChatCompletionRequestMessage[], model: TiktokenModel): number;
export declare function assertValidModel(model: string): asserts model is SupportedModels;
export declare function chunkStringByTokenCount(input: string, targetTokenCount: number, model: TiktokenModel, overlapPercent: number): string[];
export declare function getCostForTokens(tokenCount: number, type: 'prompt' | 'completion', model: SupportedModels): number;
export declare function getCostForPrompt(messages: ChatCompletionRequestMessage[], model: SupportedModels): number;
export declare const modelOptions: {
    value: string;
    label: string;
}[];
