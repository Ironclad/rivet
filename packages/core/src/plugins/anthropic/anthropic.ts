import fetchEventSource from './fetchEventSource.js';

export type AnthropicModel = {
  maxTokens: number;
  cost: {
    prompt: number;
    completion: number;
  };
  displayName: string;
};

export const anthropicModels = {
  'claude-instant-1': {
    maxTokens: 100000,
    cost: {
      prompt: 0.00163,
      completion: 0.00551,
    },
    displayName: 'Claude Instant',
  },
  'claude-2': {
    maxTokens: 100000,
    cost: {
      prompt: 0.01102,
      completion: 0.03268,
    },
    displayName: 'Claude 2',
  },
} satisfies Record<string, AnthropicModel>;

export type AnthropicModels = keyof typeof anthropicModels;

export const anthropicModelOptions = Object.entries(anthropicModels).map(([id, { displayName }]) => ({
  value: id,
  label: displayName,
}));

export type ChatCompletionOptions = {
  apiKey: string;
  model: AnthropicModels;
  prompt: string;
  max_tokens_to_sample: number;
  stop_sequences?: string[];
  temperature?: number;
  top_p?: number;
  top_k?: number;
  signal?: AbortSignal;
};

export type ChatCompletionChunk = {
  completion: string;
  stop_reason: 'stop_sequence' | null;
  model: string;
};

export async function* streamChatCompletions({
  apiKey,
  signal,
  ...rest
}: ChatCompletionOptions): AsyncGenerator<ChatCompletionChunk> {
  const defaultSignal = new AbortController().signal;
  const response = await fetchEventSource('https://api.anthropic.com/v1/complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      ...rest,
      stream: true,
    }),
    signal: signal ?? defaultSignal,
  });

  let hadChunks = false;
  let nextDataType: string | undefined;

  for await (const chunk of response.events()) {
    hadChunks = true;

    if (chunk === '[DONE]') {
      return;
    } else if (/\[\w+\]/.test(chunk)) {
      nextDataType = chunk.slice(1, -1);
      continue;
    }

    let data: ChatCompletionChunk;
    try {
      data = JSON.parse(chunk);
    } catch (err) {
      console.error('JSON parse failed on chunk: ', chunk);
      throw err;
    }

    yield data;
  }

  if (!hadChunks) {
    const responseJson = await response.json();
    throw new Error(`No chunks received. Response: ${JSON.stringify(responseJson)}`);
  }
}
