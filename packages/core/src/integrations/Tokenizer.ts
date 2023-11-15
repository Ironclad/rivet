import type { ChartNode, ChatMessage, GptFunction } from '../index.js';

export type TokenizerCallInfo = {
  node: ChartNode;
  model?: string;
  endpoint?: string;
};

export type Tokenizer = {
  on(event: 'error', listener: (err: Error) => void): void;

  getTokenCountForString(input: string, info: TokenizerCallInfo): number;

  getTokenCountForMessages(messages: ChatMessage[], gptFunctions: GptFunction[] | undefined, info: TokenizerCallInfo): Promise<number>;
};
