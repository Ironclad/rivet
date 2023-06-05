import { encoding_for_model, TiktokenModel } from '@dqbd/tiktoken';
import { ChatCompletionRequestMessage } from './openai';

export const supportedModels = [
  'gpt-4',
  'gpt-4-32k',
  'gpt-4-tools',
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-tools',
  //'text-davinci-003', 'code-davinci-002'
] as const;
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
  'gpt-4-tools': 8192,
  'gpt-3.5-turbo': 4096,
  'gpt-3.5-turbo-tools': 4096,
  // 'text-davinci-003': 4097,
  // 'code-davinci-002': 8001,
} as const;

export const modelToTiktokenModel: Record<SupportedModels, TiktokenModel> = {
  'gpt-4': 'gpt-4',
  'gpt-4-32k': 'gpt-4-32k',
  'gpt-4-tools': 'gpt-4',
  'gpt-3.5-turbo': 'gpt-3.5-turbo',
  'gpt-3.5-turbo-tools': 'gpt-3.5-turbo',
  // 'text-davinci-003': 'text-davinci-003',
  // 'code-davinci-002': 'code-davinci-002',
};

export function assertValidModel(model: string): asserts model is SupportedModels {
  if (!supportedModels.includes(model as any)) {
    throw new Error(`Invalid model: ${model}`);
  }
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

const modelCost: Record<SupportedModels, { prompt: number; completion: number }> = {
  'gpt-4': { prompt: 0.03, completion: 0.06 },
  'gpt-4-32k': { prompt: 0.06, completion: 0.12 },
  'gpt-4-tools': { prompt: 0.03, completion: 0.06 },
  'gpt-3.5-turbo': { prompt: 0.002, completion: 0.002 },
  'gpt-3.5-turbo-tools': { prompt: 0.002, completion: 0.002 },
};

export function getCostForTokens(tokenCount: number, type: 'prompt' | 'completion', model: SupportedModels) {
  const costPerThousand = modelCost[model][type];
  return (tokenCount / 1000) * costPerThousand;
}

export function getCostForPrompt(messages: ChatCompletionRequestMessage[], model: SupportedModels) {
  const tokenCount = getTokenCountForMessages(messages, modelToTiktokenModel[model]);
  return getCostForTokens(tokenCount, 'prompt', model);
}
