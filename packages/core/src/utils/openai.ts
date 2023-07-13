import fetchEventSource from './fetchEventSource.js';
import { SupportedModels } from './tokenizer.js';

// https://github.com/openai/openai-node/issues/18#issuecomment-1518715285

export class OpenAIError extends Error {
  constructor(readonly status: number, readonly responseJson: any) {
    super(`OpenAIError: ${status} ${JSON.stringify(responseJson)}`);
    this.name = 'OpenAIError';
  }
}

export type ChatCompletionRole = 'system' | 'assistant' | 'user' | 'function';

export type ChatCompletionRequestMessage = {
  role: ChatCompletionRole;

  /** The content of the message. */
  content: string;

  function_call?: object;
};

// https://platform.openai.com/docs/api-reference/chat/create
export type ChatCompletionOptions = {
  auth: { apiKey: string; organization?: string };
  signal?: AbortSignal;
  model: SupportedModels;
  messages: ChatCompletionRequestMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  n?: number;
  stop?: string | string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  logit_bias?: {
    [key: number]: number;
  };

  functions?: ChatCompletionFunction[];
};

export type ChatCompletionResponse = {
  id: string;
  object: 'text_completion';
  created: number;
  model: string;
  choices: ChatCompletionResponseChoice[];
};

export type ChatCompletionResponseMessage = {
  role: ChatCompletionRole;
  content: string;
  function_call?: object;
};

export type ChatCompletionResponseChoice = {
  index: number;
  finish_reason: 'stop' | 'length' | 'insufficient_tokens' | 'function_call';
  message: ChatCompletionResponseMessage;
};

export type ChatCompletionChunk = {
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices?: ChatCompletionChunkChoice[];
};

export type ChatCompletionChunkChoice = {
  index: number;
  message_index: number;
  delta: {
    role?: 'assistant';
    content?: string;
    function_call?: object;
  };
  finish_reason: null | 'stop' | 'length' | 'insufficient_tokens' | 'function_call';
};

export type ChatCompletionFunction = {
  name: string;
  description: string;
  parameters: object;
};

export async function* streamChatCompletions({
  auth,
  signal,
  ...rest
}: ChatCompletionOptions): AsyncGenerator<ChatCompletionChunk> {
  const defaultSignal = new AbortController().signal;
  const response = await fetchEventSource('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.apiKey}`,
      ...(auth.organization ? { 'OpenAI-Organization': auth.organization } : {}),
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
    throw new OpenAIError(response.status, responseJson);
  }
}
