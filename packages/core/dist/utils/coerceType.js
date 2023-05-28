import { match } from 'ts-pattern';
import { isArrayDataValue, unwrapDataValue } from '../model/DataValue';
import { expectTypeOptional } from './expectType';
export function coerceTypeOptional(wrapped, type) {
    const value = wrapped ? unwrapDataValue(wrapped) : undefined;
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
        .otherwise(() => expectTypeOptional(value, type));
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
    if (typeof value === 'object' && value !== null) {
        return { type: 'object', value: value };
    }
    throw new Error(`Cannot infer type of value: ${value}`);
}
