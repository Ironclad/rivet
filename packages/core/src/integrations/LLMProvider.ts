import { type ArrayDataValue, type ChatMessageDataValue } from '../model/DataValue.js';

export type LLMParameters = {
  [key: string]: string;
};

export interface LLMProvider {
  getCompletions(
    messages: ArrayDataValue<ChatMessageDataValue>,
    parameters: LLMParameters,
  ): Promise<ArrayDataValue<ChatMessageDataValue>>;
}
