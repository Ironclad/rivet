import { encode, encodeChat } from 'gpt-tokenizer';
import { LLMTokenizer } from './tokenizer.js';
import { ChatCompletionRequestMessage } from './openai.js';

export const GptTokenizer: LLMTokenizer = {
  getTokenCountForString(input: string): number {
    const encoded = encode(input);
    return encoded.length;
  },

  getTokenCountForMessages(messages: ChatCompletionRequestMessage[]): number {
    const encoded = encodeChat(
      messages.map((message) => ({
        role: message.role as 'system' | 'assistant' | 'user' | undefined,
        content: message.content,
        // TODO name
      })),
    );

    return encoded.length;
  },
};
