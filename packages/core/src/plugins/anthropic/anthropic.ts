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
    maxTokens: 100_000,
    cost: {
      prompt: 0.00163,
      completion: 0.00551,
    },
    displayName: 'Claude Instant',
  },
  'claude-2': {
    maxTokens: 100_000,
    cost: {
      prompt: 0.01102,
      completion: 0.03268,
    },
    displayName: 'Claude 2',
  },
  'claude-2.1': {
    maxTokens: 200_000,
    cost: {
      prompt: 0.01102,
      completion: 0.03268,
    },
    displayName: 'Claude 2.1',
  },
  'claude-3-sonnet-20240229': {
    maxTokens: 200_000,
    cost: {
      prompt: 0.000003,
      completion: 0.000015,
    },
    displayName: 'Claude 3 Sonnet',
  },
  'claude-3-opus-20240229': {
    maxTokens: 200_000,
    cost: {
      prompt: 0.000015,
      completion: 0.000075,
    },
    displayName: 'Claude 3 Opus',
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
  messages: {
    role: string;
    content: string | {
      type: string;
      text?: string;
      source?: {
        type: string;
        media_type: string;
        data: string;
      };
    }[];
  }[];
  system?: string;
  max_tokens: number;
  stop_sequences?: string[];
  temperature?: number;
  top_p?: number;
  top_k?: number;
  signal?: AbortSignal;
  stream?: boolean;
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
    throw new AnthropicError(`No chunks received. Response: ${JSON.stringify(responseJson)}`, response, responseJson);
  }
}

export class AnthropicError extends Error {
  constructor(
    message: string,
    public readonly response: Response,
    public readonly responseJson: unknown,
  ) {
    super(message);
  }
}

export const anthropic = {
  messages: {
    create: async (options: ChatCompletionOptions) => {
      const { apiKey, signal, model, messages, system, max_tokens, stop_sequences, temperature, top_p, top_k, stream } = options;
      const defaultSignal = new AbortController().signal;

      const requestBody: Omit<ChatCompletionOptions, 'apiKey'> = {
        model,
        messages,
        system,
        max_tokens,
        stop_sequences,
        temperature,
        top_p,
        top_k,
        stream,
      };

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'messages-2023-12-15',
        },
        body: JSON.stringify(requestBody),
        signal: signal ?? defaultSignal,
      });

      if (!response.ok) {
        const responseJson = await response.json();
        throw new AnthropicError(`Error in messages.create: ${response.statusText}`, response, responseJson);
      }

      if (stream) {
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Failed to get reader for streaming response');
        }

        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        const events: any[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value);

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data:')) {
              const data = JSON.parse(line.slice(5).trim());
              events.push(data);
            }
          }
        }

        return events;
      } else {
        const responseJson = await response.json();
        return responseJson;
      }
    },
  },
};

export type ChatCompletionOptionsWithImage = ChatCompletionOptions & {
  image?: {
    type: string;
    media_type: string;
    data: string;
  };
  stream?: boolean;
};
