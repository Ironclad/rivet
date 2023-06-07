import { match } from 'ts-pattern';
import { getScalarTypeOf, isArrayDataType, isArrayDataValue, unwrapDataValue, } from '../model/DataValue';
import { expectTypeOptional } from './expectType';
export function coerceTypeOptional(wrapped, type) {
    const value = wrapped ? unwrapDataValue(wrapped) : undefined;
    if (isArrayDataType(type) && !isArrayDataValue(value)) {
        const coerced = coerceTypeOptional(value, getScalarTypeOf(type));
        if (coerced === undefined) {
            return undefined;
        }
        return [coerced];
    }
    const result = match(type)
        .with('string', () => {
        if (!value) {
            return '';
        }
        if (isArrayDataValue(value)) {
            return value.value
                .map((v) => coerceTypeOptional({ type: value.type.replace('[]', ''), value: v }, 'string'))
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
            return value.value.message;
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
    })
        .with('boolean', () => {
        if (!value || !value.value) {
            return false;
        }
        if (isArrayDataValue(value)) {
            return value.value
                .map((v) => coerceTypeOptional({ type: value.type.replace('[]', ''), value: v }, 'boolean'))
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
            return value.value.message.length > 0;
        }
        return !!value.value;
    })
        .with('chat-message', () => {
        if (!value || value.value == null) {
            return undefined;
        }
        if (value.type === 'chat-message') {
            return value.value;
        }
        if (value.type === 'string') {
            return { type: 'user', message: value.value };
        }
        if (value.type === 'object' && 'type' in value.value && 'message' in value.value) {
            return value.value;
        }
        if (value.type === 'any') {
            const inferred = inferType(value.value);
            return coerceTypeOptional(inferred, 'chat-message');
        }
    })
        .with('number', () => {
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
            return parseFloat(value.value.message);
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
    })
        .with('object', () => {
        if (!value || value.value == null) {
            return undefined;
        }
        return value.value; // Whatever, consider anything an object
    })
        .otherwise(() => {
        if (!value) {
            return value;
        }
        if (getScalarTypeOf(value.type) === 'any' || getScalarTypeOf(type) === 'any') {
            return value.value;
        }
        return expectTypeOptional(value, type);
    });
    return result;
}
export function coerceType(value, type) {
    const result = coerceTypeOptional(value, type);
    if (result === undefined) {
        throw new Error(`Expected value of type ${type} but got undefined`);
    }
    return result;
}
export function inferType(value) {
    if (value === undefined) {
        return { type: 'any', value: undefined };
    }
    if (value === null) {
        return { type: 'any', value: null };
    }
    if (typeof value === 'function') {
        return { type: 'fn<any>', value: value };
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
    if (typeof value === 'object') {
        return { type: 'object', value: value };
    }
    throw new Error(`Cannot infer type of value: ${value}`);
}
