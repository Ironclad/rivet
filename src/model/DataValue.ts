export type DataValueDef<Type extends string, RuntimeType> = {
  type: Type;
  value: RuntimeType;
};

export type StringDataValue = DataValueDef<'string', string>;
export type NumberDataValue = DataValueDef<'number', number>;
export type BoolDataValue = DataValueDef<'boolean', boolean>;

export type ChatMessage = { type: 'system' | 'user' | 'assistant'; message: string };
export type ChatMessagesData = ChatMessage[];

export type ChatMessageDataValue = DataValueDef<'chat-message', ChatMessage>;
export type ChatMessagesDataValue = DataValueDef<'chat-messages', ChatMessagesData>;

export type DateDataValue = DataValueDef<'date', string>;
export type TimeDataValue = DataValueDef<'time', string>;
export type DateTimeDataValue = DataValueDef<'datetime', string>;

export type DataValue =
  | StringDataValue
  | NumberDataValue
  | ChatMessagesDataValue
  | DateDataValue
  | TimeDataValue
  | DateTimeDataValue
  | BoolDataValue
  | ChatMessageDataValue;

export type DataType = DataValue['type'];
