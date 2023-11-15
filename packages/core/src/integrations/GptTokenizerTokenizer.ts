import { type ChatMessage, type GptFunction } from '../index.js';
import type { Tokenizer, TokenizerCallInfo } from './Tokenizer.js';
import { encode, encodeChat } from 'gpt-tokenizer';
import Emittery from 'emittery';
import { getError } from '../utils/errors.js';
import { chatMessageToOpenAIChatCompletionMessage } from '../utils/chatMessageToOpenAIChatCompletionMessage.js';
import type { ChatCompletionRequestUserMessageTextContent } from '../utils/openai.js';

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

  async getTokenCountForMessages(messages: ChatMessage[], functions: GptFunction[] | undefined,_info: TokenizerCallInfo): Promise<number> {
    try {
      const openaiMessages = await Promise.all(
        messages.map((message) => chatMessageToOpenAIChatCompletionMessage(message)),
      );

      const validMessages = openaiMessages
        .filter((message) => message.role !== 'tool')
        .map((message) => {
          if (Array.isArray(message.content)) {
            const textContent = message.content
              .filter((c): c is ChatCompletionRequestUserMessageTextContent => c.type === 'text')
              .map((c) => c.text)
              .join('');
            return { ...message, content: textContent };
          }

          return message;
        });

      const encodedChat = encodeChat(validMessages as any, 'gpt-3.5-turbo');
      const encodedFunctions = functions && functions.length > 0 ? encode(this.convertGptFunctionsToPromptString(functions)) : [];

      return encodedChat.length + encodedFunctions.length;
    } catch (err) {
      this.emitter.emit('error', getError(err));
      return 0;
    }
  }

  /**
   * Converts GPT Functions to approximate TypeScript-style string.
   * Per thread: https://community.openai.com/t/how-to-calculate-the-tokens-when-using-function-call/266573/24
   * We should consider using a different library, eg. https://github.com/hmarr/openai-chat-tokens
   * @param functions
   */
  private convertGptFunctionsToPromptString(functions: GptFunction[]): string {
    return `
# Tools

## functions

namespace functions {
${
  functions.map((fn) => `
// ${fn.description}
type ${fn.name} = (_: {
${Object.entries((fn.parameters as any)?.properties ?? {})
.map(([parameterName, value]: [string, any]) => (`// ${value?.description}\n${parameterName}?: ${value?.type}`)).join('\n')}
})
`).join('')
}
} // namespace functions
`;
  }
}
