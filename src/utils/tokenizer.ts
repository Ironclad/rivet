import { ChatCompletionRequestMessage } from 'openai';

import { encoding_for_model, TiktokenModel } from '@dqbd/tiktoken';

export const supportedModels = ['gpt-4', 'gpt-4-32k', 'gpt-3.5-turbo', 'text-davinci-003', 'code-davinci-002'] as const;
export type SupportedModels = (typeof supportedModels)[number];

export function getTokenCountForMessages(messages: ChatCompletionRequestMessage[], model: TiktokenModel): number {
  const encoding = encoding_for_model(model);

  return messages.reduce((sum, message) => {
    const encoded = encoding.encode(JSON.stringify(message));
    return sum + encoded.length;
  }, 0);
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
