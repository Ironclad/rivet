import { encoding_for_model, TiktokenModel } from '@dqbd/tiktoken';
import { ChatCompletionRequestMessage } from './openai.js';

type OpenAIModel = {
  maxTokens: number;
  tiktokenModel: TiktokenModel;
  cost: {
    prompt: number;
    completion: number;
  };
  displayName: string;
};

export const openaiModels = {
  'gpt-4': {
    maxTokens: 8192,
    tiktokenModel: 'gpt-4',
    cost: {
      prompt: 0.03,
      completion: 0.06,
    },
    displayName: 'GPT-4',
  },
  'gpt-4-32k': {
    maxTokens: 32768,
    tiktokenModel: 'gpt-4-32k',
    cost: {
      prompt: 0.06,
      completion: 0.12,
    },
    displayName: 'GPT-4 32k',
  },
  'gpt-4-0613': {
    maxTokens: 8192,
    tiktokenModel: 'gpt-4',
    cost: {
      prompt: 0.03,
      completion: 0.06,
    },
    displayName: 'GPT-4 (v0613)',
  },
  'gpt-4-32k-0613': {
    maxTokens: 32768,
    tiktokenModel: 'gpt-4',
    cost: {
      prompt: 0.06,
      completion: 0.12,
    },
    displayName: 'GPT-4 32k (v0613)',
  },
  'gpt-3.5-turbo': {
    maxTokens: 4096,
    tiktokenModel: 'gpt-3.5-turbo',
    cost: {
      prompt: 0.002,
      completion: 0.002,
    },
    displayName: 'GPT-3.5 Turbo',
  },

  'gpt-3.5-turbo-0613': {
    maxTokens: 16384,
    tiktokenModel: 'gpt-3.5-turbo',
    cost: {
      prompt: 0.002,
      completion: 0.002,
    },
    displayName: 'GPT-3.5 (v0613)',
  },

  'gpt-3.5-turbo-16k-0613': {
    maxTokens: 16384,
    tiktokenModel: 'gpt-3.5-turbo',
    cost: {
      prompt: 0.003,
      completion: 0.004,
    },
    displayName: 'GPT-3.5 16k (v0613)',
  },
} satisfies Record<string, OpenAIModel>;

export const supportedModels = Object.keys(openaiModels) as (keyof typeof openaiModels)[];
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

export function getCostForTokens(tokenCount: number, type: 'prompt' | 'completion', model: SupportedModels) {
  const costPerThousand = openaiModels[model].cost[type];
  return (tokenCount / 1000) * costPerThousand;
}

export function getCostForPrompt(messages: ChatCompletionRequestMessage[], model: SupportedModels) {
  const tokenCount = getTokenCountForMessages(messages, openaiModels[model].tiktokenModel);
  return getCostForTokens(tokenCount, 'prompt', model);
}

export const modelOptions = Object.entries(openaiModels).map(([id, { displayName }]) => ({
  value: id,
  label: displayName,
}));
