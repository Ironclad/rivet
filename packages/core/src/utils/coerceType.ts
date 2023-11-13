import { match } from 'ts-pattern';
import {
  type ChatMessage,
  type DataType,
  type DataValue,
  type GetDataValue,
  getScalarTypeOf,
  isArrayDataType,
  isArrayDataValue,
  unwrapDataValue,
} from '../model/DataValue.js';
import { expectTypeOptional } from './expectType.js';

export function coerceTypeOptional<T extends DataType>(
  wrapped: DataValue | undefined,
  type: T,
): GetDataValue<T>['value'] | undefined {
  const value = wrapped ? unwrapDataValue(wrapped) : undefined;

  // Coerce 'true' to [true] for example
  if (isArrayDataType(type) && !isArrayDataValue(value)) {
    const coerced = coerceTypeOptional(value, getScalarTypeOf(type));
    if (coerced === undefined) {
      return undefined;
    }

    return [coerced] as any;
  }

  // Coerce foo[] to bar[]
  if (isArrayDataType(type) && isArrayDataValue(value) && getScalarTypeOf(type) !== getScalarTypeOf(value.type)) {
    return value.value.map((v) =>
      coerceTypeOptional({ type: getScalarTypeOf(value.type), value: v } as DataValue, getScalarTypeOf(type)),
    ) as any;
  }

  const result = match(type as DataType)
    .with('string', () => coerceToString(value))
    .with('boolean', () => coerceToBoolean(value))
    .with('chat-message', () => coerceToChatMessage(value))
    .with('number', () => coerceToNumber(value))
    .with('object', () => coerceToObject(value))
    .with('binary', () => coerceToBinary(value))
    .otherwise(() => {
      if (!value) {
        return value;
      }

      if (getScalarTypeOf(value.type) === 'any' || getScalarTypeOf(type) === 'any') {
        return value.value;
      }

      return expectTypeOptional(value, type);
    });

  return result as GetDataValue<T>['value'] | undefined;
}

export function coerceType<T extends DataType>(value: DataValue | undefined, type: T): GetDataValue<T>['value'] {
  const result = coerceTypeOptional(value, type);
  if (result === undefined) {
    throw new Error(`Expected value of type ${type} but got undefined`);
  }
  return result as GetDataValue<T>['value'];
}

export function inferType(value: unknown): DataValue {
  if (value === undefined) {
    return { type: 'any', value: undefined };
  }

  if (value === null) {
    return { type: 'any', value: null };
  }

  if (typeof value === 'function') {
    return { type: 'fn<any>', value: value as () => unknown };
  }

  if (typeof value === 'string') {
    return { type: 'string', value };
  }

  if (typeof value === 'boolean') {
    return { type: 'boolean', value };
  }

  if (typeof value === 'number') {
    return { type: 'number', value };
  }

  if (value instanceof Date) {
    return { type: 'datetime', value: value.toISOString() };
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { type: 'any[]', value: [] };
    }

    const inferredType = inferType(value[0]);

    return { type: inferredType.type + '[]', value } as DataValue;
  }

  if (typeof value === 'object') {
    return { type: 'object', value: value as Record<string, unknown> };
  }

  throw new Error(`Cannot infer type of value: ${value}`);
}

function coerceToString(value: DataValue | undefined): string | undefined {
  if (!value) {
    return '';
  }

  if (isArrayDataValue(value)) {
    return value.value
      .map((v) => coerceTypeOptional({ type: getScalarTypeOf(value.type), value: v } as DataValue, 'string'))
      .join('\n');
  }

  if (value.type === 'string') {
    return value.value;
  }

  if (value.type === 'boolean') {
    return value.value.toString();
  }

  if (value.type === 'number') {
    return value.value.toString();
  }

  if (value.type === 'date') {
    return value.value;
  }

  if (value.type === 'time') {
    return value.value;
  }

  if (value.type === 'datetime') {
    return value.value;
  }

  if (value.type === 'chat-message') {
    const messageParts = Array.isArray(value.value.message) ? value.value.message : [value.value.message];
    const singleString = messageParts
      .map((part) => {
        if (typeof part === 'string') {
          return part;
        }

        return part.type === 'url' ? `(Image: ${part.url})` : '(Image)';
      })
      .join('\n\n');
    return singleString;
  }

  if (value.value === undefined) {
    return undefined;
  }

  if (value.value === null) {
    return undefined;
  }

  // Don't know, so try to infer it from the type of the value
  if (value.type === 'any') {
    const inferred = inferType(value.value);
    return coerceTypeOptional(inferred, 'string');
  }

  return JSON.stringify(value.value);
}

function coerceToChatMessage(value: DataValue | undefined): ChatMessage | undefined {
  const chatMessage = coerceToChatMessageRaw(value);

  if (chatMessage?.type === 'assistant') {
    // Double check that arguments is a string, stringify if needed
    if (chatMessage.function_call?.arguments && typeof chatMessage.function_call.arguments !== 'string') {
      chatMessage.function_call.arguments = JSON.stringify(chatMessage.function_call.arguments);
    }
  }

  return chatMessage;
}

function coerceToChatMessageRaw(value: DataValue | undefined): ChatMessage | undefined {
  if (!value || value.value == null) {
    return undefined;
  }

  if (value.type === 'chat-message') {
    return value.value;
  }

  if (value.type === 'string') {
    return { type: 'user', message: value.value };
  }

  if (
    value.type === 'object' &&
    'type' in value.value &&
    'message' in value.value &&
    typeof value.value.type === 'string' &&
    typeof value.value.message === 'string'
  ) {
    return value.value as ChatMessage;
  }

  if (value.type === 'any') {
    const inferred = inferType(value.value);
    return coerceTypeOptional(inferred, 'chat-message');
  }
}

function coerceToBoolean(value: DataValue | undefined) {
  if (!value || !value.value) {
    return false;
  }

  if (isArrayDataValue(value)) {
    return value.value
      .map((v) => coerceTypeOptional({ type: value.type.replace('[]', ''), value: v } as DataValue, 'boolean'))
      .every((v) => v);
  }

  if (value.type === 'string') {
    return value.value.length > 0 && value.value !== 'false';
  }

  if (value.type === 'boolean') {
    return value.value;
  }

  if (value.type === 'number') {
    return value.value !== 0;
  }

  if (value.type === 'date') {
    return true;
  }

  if (value.type === 'time') {
    return true;
  }

  if (value.type === 'datetime') {
    return true;
  }

  if (value.type === 'chat-message') {
    const hasValue =
      (Array.isArray(value.value.message) && value.value.message.length > 0) ||
      (typeof value.value.message === 'string' && value.value.message.length > 0) ||
      (typeof value.value.message === 'object' &&
        'type' in value.value.message &&
        value.value.message.type === 'url' &&
        value.value.message.url.length > 0);

    return hasValue;
  }

  return !!value.value;
}

function coerceToNumber(value: DataValue | undefined): number | undefined {
  if (!value || value.value == null) {
    return undefined;
  }

  if (isArrayDataValue(value)) {
    return undefined;
  }

  if (value.type === 'string') {
    return parseFloat(value.value);
  }

  if (value.type === 'boolean') {
    return value.value ? 1 : 0;
  }

  if (value.type === 'number') {
    return value.value;
  }

  if (value.type === 'date') {
    return new Date(value.value).valueOf();
  }

  if (value.type === 'time') {
    return new Date(value.value).valueOf();
  }

  if (value.type === 'datetime') {
    return new Date(value.value).valueOf();
  }

  if (value.type === 'chat-message') {
    if (typeof value.value.message === 'string') {
      return parseFloat(value.value.message);
    }

    if (
      Array.isArray(value.value.message) &&
      value.value.message.length === 1 &&
      typeof value.value.message[0] === 'string'
    ) {
      return parseFloat(value.value.message[0]);
    }

    return undefined;
  }

  if (value.type === 'any') {
    const inferred = inferType(value.value);
    return coerceTypeOptional(inferred, 'number');
  }

  if (value.type === 'object') {
    const inferred = inferType(value.value);
    return coerceTypeOptional(inferred, 'number');
  }

  return undefined;
}

function coerceToObject(value: DataValue | undefined): object | undefined {
  if (!value || value.value == null) {
    return undefined;
  }

  return value.value; // Whatever, consider anything an object
}

function coerceToBinary(value: DataValue | undefined): Uint8Array | undefined {
  if (!value || value.value == null) {
    return undefined;
  }

  if (value.type === 'binary') {
    return value.value;
  }

  if (value.type === 'string') {
    return new TextEncoder().encode(value.value);
  }

  if (value.type === 'boolean') {
    return new TextEncoder().encode(value.value.toString());
  }

  if (value.type === 'vector' || value.type === 'number[]') {
    return new Uint8Array(value.value);
  }

  if (value.type === 'number') {
    return new Uint8Array([value.value]);
  }

  if (value.type === 'audio' || value.type === 'image') {
    return value.value.data;
  }

  return new TextEncoder().encode(JSON.stringify(value.value));
}

export function canBeCoercedAny(from: DataType | Readonly<DataType[]>, to: DataType | Readonly<DataType[]>) {
  for (const fromType of Array.isArray(from) ? from : [from]) {
    for (const toType of Array.isArray(to) ? to : [to]) {
      if (canBeCoerced(fromType, toType)) {
        return true;
      }
    }
  }
  return false;
}

// TODO hard to keep in sync with coerceType
export function canBeCoerced(from: DataType, to: DataType) {
  if (to === 'any' || from === 'any') {
    return true;
  }

  if (isArrayDataType(to) && isArrayDataType(from)) {
    return canBeCoerced(getScalarTypeOf(from), getScalarTypeOf(to));
  }

  if (isArrayDataType(to) && !isArrayDataType(from)) {
    return canBeCoerced(from, getScalarTypeOf(to));
  }

  if (isArrayDataType(from) && !isArrayDataType(to)) {
    return to === 'string' || to === 'object';
  }

  if (to === 'gpt-function') {
    return from === 'object';
  }

  if (to === 'audio' || to === 'binary' || to === 'image') {
    return false;
  }

  return true;
}
