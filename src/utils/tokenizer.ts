import { ChatCompletionRequestMessage } from 'openai';

import { encoding_for_model, TiktokenModel } from '@dqbd/tiktoken';

export const supportedModels = ['gpt-4', 'gpt-4-32k', 'gpt-3.5-turbo', 'text-davinci-003', 'code-davinci-002'] as const;
export type SupportedModels = (typeof supportedModels)[number];

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

export const modelMaxTokens: Record<SupportedModels, number> = {
  'gpt-4': 8192,
  'gpt-4-32k': 32768,
  'gpt-3.5-turbo': 4096,
  'text-davinci-003': 4097,
  'code-davinci-002': 8001,
} as const;

export const modelToTiktokenModel: Record<SupportedModels, TiktokenModel> = {
  'gpt-4': 'gpt-4',
  'gpt-4-32k': 'gpt-4-32k',
  'gpt-3.5-turbo': 'gpt-3.5-turbo',
  'text-davinci-003': 'text-davinci-003',
  'code-davinci-002': 'code-davinci-002',
};

export function assertValidModel(model: string): asserts model is SupportedModels {
  if (!supportedModels.includes(model as any)) {
    throw new Error(`Invalid model: ${model}`);
  }
}

export function chunkStringByTokenCount(input: string, targetTokenCount: number, model: TiktokenModel) {
  const chunks: string[] = [];
  const guess = Math.floor(targetTokenCount * (input.length / getTokenCountForString(input, model)));
  let remaining = input;

  while (remaining.length > 0) {
    chunks.push(remaining.slice(0, guess));
    remaining = remaining.slice(guess);
  }

  return chunks;
}

export function truncateStringToTokenCount(
  input: string,
  targetTokenCount: number,
  model: TiktokenModel,
): [string, number] {
  throw new Error();

  // let left = 0;
  // let right = input.length;
  // let guess2 = input.length / 4; // ~4 chars per token
  // let guess = Math.floor(targetTokenCount * (right / getTokenCountForString(input, model)));
  // const tolerance = 0.1 * targetTokenCount;

  // while (left < right) {
  //   const truncatedString = input.slice(0, guess);
  //   const tokenCount = getTokenCountForString(truncatedString, model);

  //   if (Math.abs(tokenCount - targetTokenCount) <= tolerance) {
  //     return [truncatedString, tokenCount];
  //   } else if (tokenCount < targetTokenCount) {
  //     left = guess + 1;
  //   } else {
  //     right = guess;
  //   }

  //   guess = Math.floor((left + right) / 2);
  // }

  // console.dir({ len: input.length, guess, guess2, targetTokenCount, tolerance, left, right }, { depth: null });

  // return [input.slice(0, left - 1), left - 1];
}
