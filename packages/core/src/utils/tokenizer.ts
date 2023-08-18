import { FakeTokenizer } from './FakeTokenizer.js';
import { ChatCompletionRequestMessage } from './openai.js';

export type LLMCost = {
  prompt: number;
  completion: number;
};

export interface LLMTokenizer {
  getTokenCountForString(input: string): number;

  getTokenCountForMessages(messages: ChatCompletionRequestMessage[]): number;
}

export const defaultTokenizer = FakeTokenizer;

export function chunkStringByTokenCount(
  tokenizer: LLMTokenizer,
  input: string,
  targetTokenCount: number,
  overlapPercent: number,
) {
  overlapPercent = Number.isNaN(overlapPercent) ? 0 : Math.max(0, Math.min(1, overlapPercent));

  const chunks: string[] = [];
  const guess = Math.floor(targetTokenCount * (input.length / tokenizer.getTokenCountForString(input)));
  let remaining = input;

  while (remaining.length > 0) {
    chunks.push(remaining.slice(0, guess));
    remaining = remaining.slice(guess - Math.floor(guess * overlapPercent));
  }

  return chunks;
}

export function getCostForTokens(tokenCount: number, type: 'prompt' | 'completion', cost: LLMCost) {
  return (tokenCount / 1000) * cost.prompt;
}

export function getCostForPrompt(tokenizer: LLMTokenizer, messages: ChatCompletionRequestMessage[], cost: LLMCost) {
  const tokenCount = tokenizer.getTokenCountForMessages(messages);
  return getCostForTokens(tokenCount, 'prompt', cost);
}
