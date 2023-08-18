import { ChatCompletionRequestMessage } from './openai.js';
import { LLMTokenizer } from './tokenizer.js';

export const FakeTokenizer: LLMTokenizer = {
  getTokenCountForString: function (_input: string): number {
    return _input.split(' ').length * 2;
  },
  getTokenCountForMessages: function (_messages: ChatCompletionRequestMessage[]): number {
    return _messages.reduce((sum, message) => message.content.split(' ').length * 2 + sum, 0);
  },
};
