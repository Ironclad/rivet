export type DataValueDef<Type extends string, RuntimeType> = {
  type: Type;
  value: RuntimeType;
};

export type StringDataValue = DataValueDef<'string', string>;
export type StringArrayDataValue = DataValueDef<'string[]', string[]>;
export type NumberDataValue = DataValueDef<'number', number>;
export type BoolDataValue = DataValueDef<'boolean', boolean>;

export type ChatMessage = { type: 'system' | 'user' | 'assistant'; message: string };
export type ChatMessagesData = ChatMessage[];

export type ChatMessageDataValue = DataValueDef<'chat-message', ChatMessage>;
export type ChatMessagesDataValue = DataValueDef<'chat-messages', ChatMessagesData>;

export type DateDataValue = DataValueDef<'date', string>;
export type TimeDataValue = DataValueDef<'time', string>;
export type DateTimeDataValue = DataValueDef<'datetime', string>;

export type ControlFlowExcludedDataValue = DataValueDef<'control-flow-excluded', undefined>;

export type DataValue =
  | StringDataValue
  | NumberDataValue
  | ChatMessagesDataValue
  | DateDataValue
  | TimeDataValue
  | DateTimeDataValue
  | BoolDataValue
  | ChatMessageDataValue
  | ControlFlowExcludedDataValue
  | StringArrayDataValue;

export type DataType = DataValue['type'];

export type GetDataValue<Type extends DataType> = Extract<DataValue, { type: Type }>;

export function expectType<T extends DataType>(value: DataValue | undefined, type: T): GetDataValue<T>['value'] {
  if (type.endsWith('[]') && value?.type === 'string') {
    return [value.value] as GetDataValue<T>['value'];
  }

  if (value?.type !== type) {
    throw new Error(`Expected value of type ${type} but got ${value?.type}`);
  }
  return value.value as GetDataValue<T>['value'];
}

export function expectTypeOptional<T extends DataType>(
  value: DataValue | undefined,
  type: T,
): GetDataValue<T>['value'] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value.type !== type) {
    throw new Error(`Expected value of type ${type} but got ${value?.type}`);
  }
  return value.value as GetDataValue<T>['value'] | undefined;
}
