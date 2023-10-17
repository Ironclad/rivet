import { type ChatMessage } from '../index.js';
import type { Tokenizer, TokenizerCallInfo } from './Tokenizer.js';
import { encode, encodeChat } from 'gpt-tokenizer';
import Emittery from 'emittery';
import { getError } from '../utils/errors.js';
import { sum } from 'lodash';

export class GptTokenizerTokenizer implements Tokenizer {
  emitter = new Emittery<{
    error: Error;
  }>();

  on(event: 'error', listener: (err: Error) => void): void {
    this.emitter.on(event, listener);
  }

  getTokenCountForString(input: string, _info: TokenizerCallInfo): number {
    return encode(input).length;
  }

  getTokenCountForMessages(messages: ChatMessage[], _info: TokenizerCallInfo): number {
    try {
      const encodedChat = encodeChat(
        messages.map((message) => ({
          role: message.type as 'system' | 'user' | 'assistant', // Doesn't support 'function' yet
          content: message.message,
          name: message.name,
        })),
        'gpt-3.5-turbo',
      );

      return encodedChat.length;
    } catch (err) {
      this.emitter.emit('error', getError(err));
      return 0;
    }
  }
}
