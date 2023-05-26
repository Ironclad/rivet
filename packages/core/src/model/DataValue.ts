import { match } from 'ts-pattern';
import { exhaustiveTuple } from '../utils/genericUtilFunctions';

export type DataValueDef<Type extends string, RuntimeType> = {
  type: Type;
  value: RuntimeType;
};

export type StringDataValue = DataValueDef<'string', string>;
export type NumberDataValue = DataValueDef<'number', number>;
export type BoolDataValue = DataValueDef<'boolean', boolean>;

export type ChatMessage = { type: 'system' | 'user' | 'assistant'; message: string };

export type ChatMessageDataValue = DataValueDef<'chat-message', ChatMessage>;

export type DateDataValue = DataValueDef<'date', string>;
export type TimeDataValue = DataValueDef<'time', string>;
export type DateTimeDataValue = DataValueDef<'datetime', string>;
export type AnyDataValue = DataValueDef<'any', unknown>;
export type ObjectDataValue = DataValueDef<'object', Record<string, unknown>>;

export type ControlFlowExcludedDataValue = DataValueDef<'control-flow-excluded', undefined | 'loop-not-broken'>;

export type ScalarDataValue =
  | StringDataValue
  | NumberDataValue
  | DateDataValue
  | TimeDataValue
  | DateTimeDataValue
  | BoolDataValue
  | ChatMessageDataValue
  | ControlFlowExcludedDataValue
  | AnyDataValue
  | ObjectDataValue;

export type ScalarType = ScalarDataValue['type'];

export type ArrayDataValue<T extends ScalarDataValue> = DataValueDef<`${T['type']}[]`, T['value'][]>;

export type StringArrayDataValue = ArrayDataValue<StringDataValue>;

export type ArrayDataValues = {
  [P in ScalarDataValue['type']]: ArrayDataValue<Extract<ScalarDataValue, { type: P }>>;
}[ScalarDataValue['type']];

export type DataValue = ScalarDataValue | ArrayDataValues;

export type DataType = DataValue['type'];

export type GetDataValue<Type extends DataType> = Extract<DataValue, { type: Type }>;

export const dataTypes = exhaustiveTuple<DataType>()(
  'any',
  'any[]',
  'boolean',
  'boolean[]',
  'string',
  'string[]',
  'number',
  'number[]',
  'date',
  'date[]',
  'time',
  'time[]',
  'datetime',
  'datetime[]',
  'chat-message',
  'chat-message[]',
  'control-flow-excluded',
  'control-flow-excluded[]',
  'object',
  'object[]',
);

export const scalarTypes = exhaustiveTuple<ScalarType>()(
  'any',
  'boolean',
  'string',
  'number',
  'date',
  'time',
  'datetime',
  'chat-message',
  'control-flow-excluded',
  'object',
);

export const dataTypeDisplayNames: Record<DataType, string> = {
  any: 'Any',
  'any[]': 'Any Array',
  boolean: 'Boolean',
  'boolean[]': 'Boolean Array',
  string: 'String',
  'string[]': 'String Array',
  number: 'Number',
  'number[]': 'Number Array',
  date: 'Date',
  'date[]': 'Date Array',
  time: 'Time',
  'time[]': 'Time Array',
  datetime: 'DateTime',
  'datetime[]': 'DateTime Array',
  'chat-message': 'ChatMessage',
  'chat-message[]': 'ChatMessage Array',
  'control-flow-excluded': 'ControlFlowExcluded',
  'control-flow-excluded[]': 'ControlFlowExcluded Array',
  object: 'Object',
  'object[]': 'Object Array',
};

export function isArrayDataValue(value: DataValue | undefined): value is ArrayDataValues {
  if (!value) {
    return false;
  }

  return (
    (value.type.endsWith('[]') || ((value?.type === 'any' || value.type === 'object') && Array.isArray(value.value))) ??
    false
  );
}

/**
 * Turns a { type: 'string[]', value: string[] } into { type: 'string', value: string }[]
 * or a { type: 'object', value: something[] } into { type: 'object', value: something }[]
 * or a { type: 'any', value: something[] } into { type: 'any', value: something }[]
 * or a { type: 'string', value: string } into [{ type: 'string', value: string }]
 */
export const arrayizeDataValue = (value: DataValue): ScalarDataValue[] => {
  const isArray =
    value.type.endsWith('[]') || ((value.type === 'any' || value.type === 'object') && Array.isArray(value.value));
  if (!isArray) {
    return [value as ScalarDataValue];
  }

  const unwrappedType = value.type.endsWith('[]') ? value.type.slice(0, -2) : value.type;

  return (value.value as unknown[]).map((v) => ({ type: unwrappedType as ScalarType, value: v })) as ScalarDataValue[];
};
