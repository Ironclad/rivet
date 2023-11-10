import { match } from 'ts-pattern';
import type { ChatMessage } from '../index.js';
import { uint8ArrayToBase64 } from './index.js';
import type { ChatCompletionRequestMessage, ChatCompletionRequestUserMessageContent } from './openai.js';

export async function chatMessageToOpenAIChatCompletionMessage(
  message: ChatMessage,
): Promise<ChatCompletionRequestMessage> {
  const onlyStringContent = (message: ChatMessage): string => {
    const parts = Array.isArray(message.message) ? message.message : [message.message];
    const stringContent = parts
      .map((part) => {
        if (typeof part !== 'string') {
          throw new Error('System prompt must be a string');
        }

        return part;
      })
      .join('\n\n');
    return stringContent;
  };

  return match(message)
    .with({ type: 'system' }, (m): ChatCompletionRequestMessage => ({ role: m.type, content: onlyStringContent(m) }))
    .with({ type: 'user' }, async (m): Promise<ChatCompletionRequestMessage> => {
      const parts = Array.isArray(m.message) ? m.message : [m.message];

      if (parts.length === 1 && typeof parts[0] === 'string') {
        return { role: m.type, content: parts[0] };
      }

      const chatMessageParts = await Promise.all(
        parts.map(async (part): Promise<ChatCompletionRequestUserMessageContent> => {
          if (typeof part === 'string') {
            return { type: 'text', text: part };
          }

          const url =
            part.type === 'url' ? part.url : `data:${part.mediaType};base64,${await uint8ArrayToBase64(part.data)}`;

          return {
            type: 'image_url',
            image_url: { url },
          };
        }),
      );

      return { role: m.type, content: chatMessageParts };
    })
    .with(
      { type: 'assistant' },
      (m): ChatCompletionRequestMessage => ({
        role: m.type,
        content: onlyStringContent(m),

        tool_calls: m.function_call
          ? [
              {
                id: m.function_call.id ?? 'unknown_function_call',
                type: 'function',
                function: m.function_call,
              },
            ]
          : undefined,
      }),
    )
    .with(
      { type: 'function' },
      (m): ChatCompletionRequestMessage => ({
        role: 'tool',
        content: onlyStringContent(m),
        tool_call_id: m.name ?? 'unknown_function_call',
      }),
    )
    .exhaustive();
}
