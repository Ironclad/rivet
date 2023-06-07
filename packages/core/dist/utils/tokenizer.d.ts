import { TiktokenModel } from '@dqbd/tiktoken';
import { ChatCompletionRequestMessage } from './openai';
export declare const supportedModels: readonly ["gpt-4", "gpt-4-32k", "gpt-4-tools", "gpt-3.5-turbo", "gpt-3.5-turbo-tools"];
export type SupportedModels = (typeof supportedModels)[number];
export declare function getTokenCountForString(input: string, model: TiktokenModel): number;
export declare function getTokenCountForMessages(messages: ChatCompletionRequestMessage[], model: TiktokenModel): number;
export declare const modelMaxTokens: Record<SupportedModels, number>;
export declare const modelToTiktokenModel: Record<SupportedModels, TiktokenModel>;
export declare function assertValidModel(model: string): asserts model is SupportedModels;
export declare function chunkStringByTokenCount(input: string, targetTokenCount: number, model: TiktokenModel, overlapPercent: number): string[];
export declare function getCostForTokens(tokenCount: number, type: 'prompt' | 'completion', model: SupportedModels): number;
export declare function getCostForPrompt(messages: ChatCompletionRequestMessage[], model: SupportedModels): number;
export declare const modelDisplayNames: Record<SupportedModels, string>;
export declare const modelOptions: {
    value: string;
    label: string;
}[];
