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
  'claude-instant-1.2': {
    maxTokens: 100_000,
    cost: {
      prompt: 0.8e-6,
      completion: 2.4e-6,
    },
    displayName: 'Claude Instant 1.2',
  },
  'claude-2': {
    maxTokens: 100_000,
    cost: {
      prompt: 8e-6,
      completion: 24e-6,
    },
    displayName: 'Claude 2',
  },
  'claude-2.1': {
    maxTokens: 200_000,
    cost: {
      prompt: 8e-6,
      completion: 24e-6,
    },
    displayName: 'Claude 2.1',
  },
  'claude-3-haiku-20240307': {
    maxTokens: 200_000,
    cost: {
      prompt: 0.25e-6,
      completion: 1.25e-6,
    },
    displayName: 'Claude 3 Haiku',
  },
  'claude-3-sonnet-20240229': {
    maxTokens: 200_000,
    cost: {
      prompt: 3e-6,
      completion: 15e-6,
    },
    displayName: 'Claude 3 Sonnet',
  },
  'claude-3-opus-20240229': {
    maxTokens: 200_000,
    cost: {
      prompt: 15e-6,
      completion: 75e-6,
    },
    displayName: 'Claude 3 Opus',
  },
} satisfies Record<string, AnthropicModel>;

export type AnthropicModels = keyof typeof anthropicModels;

export const anthropicModelOptions = Object.entries(anthropicModels).map(([id, { displayName }]) => ({
  value: id,
  label: displayName,
}));

export type Claude3ChatMessage = {
  role: 'user' | 'assistant';
  content: string | Claude3ChatMessageContentPart[];
}

export type Claude3ChatMessageContentPart = {
  type: 'text' | 'image';
  text?: string;
  source?: {
    type: 'base64';
    media_type: string;
    data: string;
  };
};

export type ChatMessageOptions = {
  apiKey: string;
  model: AnthropicModels;
  messages: Claude3ChatMessage[];
  system?: string;
  max_tokens: number;
  stop_sequences?: string[];
  temperature?: number;
  top_p?: number;
  top_k?: number;
  signal?: AbortSignal;
  stream?: boolean;
};

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
  stream?: boolean;
};

export type ChatCompletionChunk = {
  completion: string;
  stop_reason: 'stop_sequence' | null;
  model: string;
};

export type ChatMessageChunk = {
  type: 'message_start';
  message: {
    id: string;
    type: string;
    role: string;
    content: {
      type: 'text';
      text: string;
    }[];
    model: AnthropicModels;
    stop_reason: string | null;
    stop_sequence: string | null;
    usage: {
      input_tokens: number;
      output_tokens: number;
    };
  };
} | {
  type: 'content_block_start';
  index: number;
  content_block: {
    type: 'text';
    text: string;
  };
} | {
  type: 'ping';
} | {
  type: 'content_block_delta';
  index: number;
  delta: {
    type: 'text_delta';
    text: string;
  }
} | {
  type: 'message_delta';
  delta: {
    stop_reason: string | null;
    stop_sequence: string | null;
    usage: {
      output_tokens: number;
    }
  }
} | {
  type: 'message_stop';
}

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

export async function* streamMessageApi({
  apiKey,
  signal,
  ...rest
}: ChatMessageOptions): AsyncGenerator<ChatMessageChunk> {
  // Use the Messages API for Claude 3 models
  const defaultSignal = new AbortController().signal;
  const response = await fetchEventSource('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'messages-2023-12-15',
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

    if (chunk === '[message_stop]') {
      return;
    } else if (/\[\w+\]/.test(chunk)) {
      nextDataType = chunk.slice(1, -1);
      continue;
    }

    let data: ChatMessageChunk;
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
