import { encoding_for_model, TiktokenModel } from '@dqbd/tiktoken';
import { ChatCompletionRequestMessage, openaiModels } from './openai.js';

export const supportedModels = [...Object.keys(openaiModels)] as (keyof typeof openaiModels)[];
export type SupportedModels = keyof typeof openaiModels;

export function getTokenCountForString(input: string, model: TiktokenModel): number {
  const encoding = encoding_for_model(model);
  const encoded = encoding.encode(input);
  encoding.free();
  return encoded.length;
}

export function getTokenCountForMessages(messages: ChatCompletionRequestMessage[], model: TiktokenModel): number {
  const encoding = encoding_for_model(model);

  const tokenCount = messages.reduce((sum, message) => {
    const encoded = encoding.encode(JSON.stringify(message));
    return sum + encoded.length;
  }, 0);

  encoding.free();

  return tokenCount;
}

export function chunkStringByTokenCount(
  input: string,
  targetTokenCount: number,
  model: TiktokenModel,
  overlapPercent: number,
) {
  overlapPercent = Number.isNaN(overlapPercent) ? 0 : Math.max(0, Math.min(1, overlapPercent));

  const chunks: string[] = [];
  const guess = Math.floor(targetTokenCount * (input.length / getTokenCountForString(input, model)));
  let remaining = input;

  while (remaining.length > 0) {
    chunks.push(remaining.slice(0, guess));
    remaining = remaining.slice(guess - Math.floor(guess * overlapPercent));
  }

  return chunks;
}

export function getCostForTokens(tokenCount: number, type: 'prompt' | 'completion', model: SupportedModels) {
  const costPerThousand = openaiModels[model].cost[type];
  return (tokenCount / 1000) * costPerThousand;
}

export function getCostForPrompt(messages: ChatCompletionRequestMessage[], model: SupportedModels) {
  const tokenCount = getTokenCountForMessages(messages, openaiModels[model].tiktokenModel);
  return getCostForTokens(tokenCount, 'prompt', model);
}
