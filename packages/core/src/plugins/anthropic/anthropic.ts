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
  'claude-3-5-sonnet-latest': {
    maxTokens: 200_000,
    cost: {
      prompt: 3e-6,
      completion: 15e-6,
    },
    displayName: 'Claude 3.5 Sonnet',
  },
  'claude-3-5-haiku-latest': {
    maxTokens: 200_000,
    cost: {
      prompt: 0.8e-6,
      completion: 4e-6,
    },
    displayName: 'Claude 3.5 Haiku',
  },
  'claude-3-7-sonnet-latest': {
    maxTokens: 200_000,
    cost: {
      prompt: 3e-6,
      completion: 15e-6,
    },
    displayName: 'Claude 3.7 Sonnet',
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
};

export type Claude3ChatMessageTextContentPart = {
  type: 'text';
  text: string;
  cache_control: CacheControl;
};

export type Claude3ChatMessageImageContentPart = {
  type: 'image';
  source: {
    type: 'base64';
    media_type: string;
    data: string;
  };
  cache_control: CacheControl;
};

export type Claude3ChatMessageDocumentContentPart = {
  type: 'document';
  source: {
    type: 'base64';
    media_type: string;
    data: string;
  };
  title: string | undefined;
  context: string | undefined;
  citations:
    | undefined
    | {
        enabled: true;
      };
  cache_control: CacheControl;
};

export type Claude3ChatMessageToolResultContentPart = {
  type: 'tool_result';
  tool_use_id: string;
  content: string | { type: 'text'; text: string }[];
  cache_control: CacheControl;
};

export type Claude3ChatMessageToolUseContentPart = {
  type: 'tool_use';
  id: string;
  name: string;
  input: object;
  cache_control: CacheControl;
};

export type Claude3ChatMessageContentPart =
  | Claude3ChatMessageTextContentPart
  | Claude3ChatMessageImageContentPart
  | Claude3ChatMessageToolResultContentPart
  | Claude3ChatMessageToolUseContentPart
  | Claude3ChatMessageDocumentContentPart;

export type ChatMessageOptions = {
  apiEndpoint: string;
  apiKey: string;
  model: AnthropicModels;
  messages: Claude3ChatMessage[];
  system?: SystemPrompt;
  max_tokens: number;
  stop_sequences?: string[];
  temperature?: number;
  top_p?: number;
  top_k?: number;
  signal?: AbortSignal;
  stream?: boolean;
  tools?: {
    name: string;
    description: string;
    input_schema: object;
  }[];
  beta?: string;
};

export type ChatCompletionOptions = {
  apiEndpoint: string;
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

export type CacheControl = null | {
  type: 'ephemeral';
};

export type SystemPrompt = string | SystemPromptMessage[];

export type SystemPromptMessage = {
  cache_control: CacheControl;
  type: 'text';
  text: string;
};

export type ChatMessageChunk =
  | {
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
    }
  | {
      type: 'content_block_start';
      index: number;
      content_block:
        | {
            type: 'text';
            text: string;
          }
        | {
            type: 'tool_use';
            id: string;
            name: string;
            input?: object;
          };
    }
  | {
      type: 'ping';
    }
  | {
      type: 'content_block_delta';
      index: number;
      delta:
        | {
            type: 'text_delta';
            text: string;
          }
        | {
            type: 'citations_delta';
            citation: ChatMessageCitation;
          }
        | {
            type: 'input_json_delta';
            partial_json: string;
          };
    }
  | {
      type: 'message_delta';
      delta: {
        stop_reason: string | null;
        stop_sequence: string | null;
        usage: {
          output_tokens: number;
        };
      };
    }
  | {
      type: 'message_stop';
    }
  | {
      type: 'content_block_stop';
      index: number;
    };

export type ChatMessageResponse = {
  id: string;
  content: ChatMessageContentItem[];
  model: string;
  stop_reason: 'end_turn';
  stop_sequence: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
};

export type ChatMessageTextContentItem = {
  type: 'text';
  text: string;
  citations?: ChatMessageCitation[];
};

export type ChatMessageToolUseContentItem = {
  type: 'tool_use';
  id: string;
  name: string;
  input: object;
};

export type ChatMessageContentItem = ChatMessageTextContentItem | ChatMessageToolUseContentItem;

export type ChatMessageCitation =
  | {
      type: 'char_location';
      cited_text: string;
      document_index: number;
      document_title: string | null;
      start_char_index: number;
      end_chat_index: number;
    }
  | {
      type: 'page_location';
      cited_text: string;
      document_index: number;
      document_title: string | null;
      page_number: number;
      end_page_number: number;
    };

export async function* streamChatCompletions({
  apiEndpoint,
  apiKey,
  signal,
  ...rest
}: ChatCompletionOptions): AsyncGenerator<ChatCompletionChunk> {
  const defaultSignal = new AbortController().signal;
  const response = await fetchEventSource(`${apiEndpoint}/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      ...rest,
      stream: true,
    }),
    signal: signal ?? defaultSignal,
  });

  let hadChunks = false;

  for await (const chunk of response.events()) {
    hadChunks = true;

    if (chunk === '[DONE]') {
      return;
    } else if (/\[\w+\]/.test(chunk)) {
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

export async function callMessageApi({
  apiEndpoint,
  apiKey,
  signal,
  tools,
  beta,
  ...rest
}: ChatMessageOptions): Promise<ChatMessageResponse> {
  const defaultSignal = new AbortController().signal;
  const response = await fetch(`${apiEndpoint}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      ...(beta ? { 'anthropic-beta': beta } : {}),
    },
    body: JSON.stringify({
      ...rest,
      tools,
      stream: false,
    }),
    signal: signal ?? defaultSignal,
  });
  const responseJson = await response.json();
  if (response.status !== 200) {
    throw new AnthropicError(responseJson?.error?.message ?? 'Request failed', response, responseJson);
  }
  return responseJson;
}

export async function* streamMessageApi({
  apiEndpoint,
  apiKey,
  signal,
  beta,
  ...rest
}: ChatMessageOptions): AsyncGenerator<ChatMessageChunk> {
  // Use the Messages API for Claude 3 models
  const defaultSignal = new AbortController().signal;
  const response = await fetchEventSource(`${apiEndpoint}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      ...(beta ? { 'anthropic-beta': beta } : {}),
    },
    body: JSON.stringify({
      ...rest,
      stream: true,
    }),
    signal: signal ?? defaultSignal,
  });

  let hadChunks = false;

  for await (const chunk of response.events()) {
    hadChunks = true;

    if (chunk === '[message_stop]') {
      return;
    } else if (/^\[\w+\]$/.test(chunk)) {
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
