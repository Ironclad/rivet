import fetchEventSource from './fetchEventSource';
import { SupportedModels } from './tokenizer';

// https://github.com/openai/openai-node/issues/18#issuecomment-1518715285

export class OpenAIError extends Error {
  constructor(readonly status: number, readonly responseJson: any) {
    super(`OpenAIError: ${status} ${JSON.stringify(responseJson)}`);
    this.name = 'OpenAIError';
  }
}

export type ChatCompletionRequestMessage = {
  role: 'system' | 'assistant' | 'user';
  content: string;
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
};

export async function* streamChatCompletions({
  auth,
  signal,
  model,
  messages,
  temperature,
  top_p,
  max_tokens,
  n,
  stop,
  presence_penalty,
  frequency_penalty,
  logit_bias,
}: ChatCompletionOptions): AsyncGenerator<string> {
  const defaultSignal = new AbortController().signal;
  const response = await fetchEventSource('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.apiKey}`,
      ...(auth.organization ? { 'OpenAI-Organization': auth.organization } : {}),
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature,
      top_p,
      max_tokens,
      n,
      stop,
      presence_penalty,
      frequency_penalty,
      logit_bias,
    }),
    signal: signal ?? defaultSignal,
  });

  if (!response.ok) {
    throw new OpenAIError(response.status, await response.json());
  }

  for await (const chunk of response.events()) {
    if (chunk === '[DONE]') {
      return;
    }
    let data;
    try {
      data = JSON.parse(chunk);
    } catch (err) {
      console.error('JSON parse failed on chunk: ', chunk);
      throw err;
    }
    const text = data?.choices?.[0]?.delta?.content ?? '';
    if (typeof text === 'string' && text.length > 0) {
      yield text;
    }
  }
}
