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

export type FunctionDataValue<T extends ScalarOrArrayDataValue> = DataValueDef<`fn<${T['type']}>`, () => T['value']>;

export type StringArrayDataValue = ArrayDataValue<StringDataValue>;

export type ArrayDataValues = {
  [P in ScalarDataValue['type']]: ArrayDataValue<Extract<ScalarDataValue, { type: P }>>;
}[ScalarDataValue['type']];

export type ScalarOrArrayDataValue = ScalarDataValue | ArrayDataValues;

export type FunctionDataValues = {
  [P in ScalarOrArrayDataValue['type']]: FunctionDataValue<Extract<ScalarOrArrayDataValue, { type: P }>>;
}[ScalarOrArrayDataValue['type']];

export type DataValue = ScalarDataValue | ArrayDataValues | FunctionDataValues;

export type DataType = DataValue['type'];
export type ScalarDataType = ScalarDataValue['type'];
export type ArrayDataType = ArrayDataValues['type'];
export type FunctionDataType = FunctionDataValues['type'];
export type ScalarOrArrayDataType = ScalarOrArrayDataValue['type'];

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
  'fn<string>',
  'fn<number>',
  'fn<boolean>',
  'fn<date>',
  'fn<time>',
  'fn<datetime>',
  'fn<any>',
  'fn<object>',
  'fn<chat-message>',
  'fn<control-flow-excluded>',
  'fn<string[]>',
  'fn<number[]>',
  'fn<boolean[]>',
  'fn<date[]>',
  'fn<time[]>',
  'fn<datetime[]>',
  'fn<any[]>',
  'fn<object[]>',
  'fn<chat-message[]>',
  'fn<control-flow-excluded[]>',
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
  'fn<string>': 'Function<String>',
  'fn<number>': 'Function<Number>',
  'fn<boolean>': 'Function<Boolean>',
  'fn<date>': 'Function<Date>',
  'fn<time>': 'Function<Time>',
  'fn<datetime>': 'Function<DateTime>',
  'fn<any>': 'Function<Any>',
  'fn<object>': 'Function<Object>',
  'fn<chat-message>': 'Function<ChatMessage>',
  'fn<control-flow-excluded>': 'Function<ControlFlowExcluded>',
  'fn<string[]>': 'Function<String Array>',
  'fn<number[]>': 'Function<Number Array>',
  'fn<boolean[]>': 'Function<Boolean Array>',
  'fn<date[]>': 'Function<Date Array>',
  'fn<time[]>': 'Function<Time Array>',
  'fn<datetime[]>': 'Function<DateTime Array>',
  'fn<any[]>': 'Function<Any Array>',
  'fn<object[]>': 'Function<Object Array>',
  'fn<chat-message[]>': 'Function<ChatMessage Array>',
  'fn<control-flow-excluded[]>': 'Function<ControlFlowExcluded Array>',
};

export function isScalarDataValue(value: DataValue | undefined): value is ScalarDataValue {
  if (!value) {
    return false;
  }

  return !isArrayDataType(value.type) && !isFunctionDataType(value.type);
}

export function isScalarDataType(type: DataType): type is ScalarDataType {
  return !isArrayDataType(type) && !isFunctionDataType(type);
}

export function isArrayDataValue(value: DataValue | undefined): value is ArrayDataValues {
  if (!value) {
    return false;
  }

  return (
    isArrayDataType(value.type) || ((value.type === 'any' || value.type === 'object') && Array.isArray(value.value))
  );
}

export function isArrayDataType(type: DataType): type is ArrayDataType {
  return type.endsWith('[]');
}

export function isFunctionDataType(type: DataType): type is FunctionDataType {
  return type.startsWith('fn<');
}

export function isFunctionDataValue(value: DataValue | undefined): value is FunctionDataValues {
  if (!value) {
    return false;
  }
  return isFunctionDataType(value.type) || (value.type === 'any' && typeof value.value === 'function');
}

export function isNotFunctionDataValue(value: DataValue | undefined): value is ScalarOrArrayDataValue {
  return !isFunctionDataValue(value);
}

export function functionTypeToScalarType(functionType: FunctionDataType): ScalarDataType {
  return functionType.slice(3, -1) as ScalarDataType;
}

export function arrayTypeToScalarType(arrayType: ArrayDataType): ScalarDataType {
  return arrayType.slice(0, -2) as ScalarDataType;
}

export function getScalarTypeOf(type: DataType): ScalarDataType {
  if (isArrayDataType(type)) {
    return arrayTypeToScalarType(type);
  }

  if (isFunctionDataType(type)) {
    return functionTypeToScalarType(type);
  }

  return type;
}

/** Unwraps a potentially function data value to a concrete value. I.e., evaluates on-demand values. */
export function unwrapDataValue(value: DataValue): ScalarOrArrayDataValue;
export function unwrapDataValue(value: DataValue | undefined): ScalarOrArrayDataValue | undefined {
  if (!value) {
    return undefined;
  }

  if (isFunctionDataValue(value)) {
    return { type: functionTypeToScalarType(value.type), value: value.value() } as ScalarOrArrayDataValue;
  }

  return value;
}

/**
 * Turns a { type: 'string[]', value: string[] } into { type: 'string', value: string }[]
 * or a { type: 'object', value: something[] } into { type: 'object', value: something }[]
 * or a { type: 'any', value: something[] } into { type: 'any', value: something }[]
 * or a { type: 'string', value: string } into [{ type: 'string', value: string }]
 */
export const arrayizeDataValue = (value: ScalarOrArrayDataValue): ScalarDataValue[] => {
  const isArray =
    value.type.endsWith('[]') || ((value.type === 'any' || value.type === 'object') && Array.isArray(value.value));
  if (!isArray) {
    return [value as ScalarDataValue];
  }

  const unwrappedType = value.type.endsWith('[]') ? value.type.slice(0, -2) : value.type;

  return (value.value as unknown[]).map((v) => ({ type: unwrappedType as ScalarType, value: v })) as ScalarDataValue[];
};

export const scalarDefaults: { [P in ScalarDataType]: (ScalarDataValue & { type: P })['value'] } = {
  string: '',
  number: 0,
  boolean: false,
  any: undefined,
  'chat-message': {
    type: 'chat-message',
    value: '',
  },
  'control-flow-excluded': {
    type: 'control-flow-excluded',
    value: undefined,
  },
  date: new Date(),
  time: new Date(),
  datetime: new Date(),
  object: {},
};
