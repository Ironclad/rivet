import { exhaustiveTuple } from '../utils/genericUtilFunctions';
export const dataTypes = exhaustiveTuple()('any', 'any[]', 'boolean', 'boolean[]', 'string', 'string[]', 'number', 'number[]', 'date', 'date[]', 'time', 'time[]', 'datetime', 'datetime[]', 'chat-message', 'chat-message[]', 'control-flow-excluded', 'control-flow-excluded[]', 'object', 'object[]', 'fn<string>', 'fn<number>', 'fn<boolean>', 'fn<date>', 'fn<time>', 'fn<datetime>', 'fn<any>', 'fn<object>', 'fn<chat-message>', 'fn<control-flow-excluded>', 'fn<string[]>', 'fn<number[]>', 'fn<boolean[]>', 'fn<date[]>', 'fn<time[]>', 'fn<datetime[]>', 'fn<any[]>', 'fn<object[]>', 'fn<chat-message[]>', 'fn<control-flow-excluded[]>');
export const scalarTypes = exhaustiveTuple()('any', 'boolean', 'string', 'number', 'date', 'time', 'datetime', 'chat-message', 'control-flow-excluded', 'object');
export const dataTypeDisplayNames = {
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
export function isScalarDataValue(value) {
    if (!value) {
        return false;
    }
    return !isArrayDataType(value.type) && !isFunctionDataType(value.type);
}
export function isScalarDataType(type) {
    return !isArrayDataType(type) && !isFunctionDataType(type);
}
export function isArrayDataValue(value) {
    if (!value) {
        return false;
    }
    return (isArrayDataType(value.type) || ((value.type === 'any' || value.type === 'object') && Array.isArray(value.value)));
}
export function isArrayDataType(type) {
    return type.endsWith('[]');
}
export function isFunctionDataType(type) {
    return type.startsWith('fn<');
}
export function isFunctionDataValue(value) {
    if (!value) {
        return false;
    }
    return isFunctionDataType(value.type) || (value.type === 'any' && typeof value.value === 'function');
}
export function isNotFunctionDataValue(value) {
    return !isFunctionDataValue(value);
}
export function functionTypeToScalarType(functionType) {
    return functionType.slice(3, -1);
}
export function arrayTypeToScalarType(arrayType) {
    return arrayType.slice(0, -2);
}
export function getScalarTypeOf(type) {
    if (isArrayDataType(type)) {
        return arrayTypeToScalarType(type);
    }
    if (isFunctionDataType(type)) {
        return functionTypeToScalarType(type);
    }
    return type;
}
export function unwrapDataValue(value) {
    if (!value) {
        return undefined;
    }
    if (isFunctionDataValue(value)) {
        return { type: functionTypeToScalarType(value.type), value: value.value() };
    }
    return value;
}
/**
 * Turns a { type: 'string[]', value: string[] } into { type: 'string', value: string }[]
 * or a { type: 'object', value: something[] } into { type: 'object', value: something }[]
 * or a { type: 'any', value: something[] } into { type: 'any', value: something }[]
 * or a { type: 'string', value: string } into [{ type: 'string', value: string }]
 */
export const arrayizeDataValue = (value) => {
    const isArray = value.type.endsWith('[]') || ((value.type === 'any' || value.type === 'object') && Array.isArray(value.value));
    if (!isArray) {
        return [value];
    }
    const unwrappedType = value.type.endsWith('[]') ? value.type.slice(0, -2) : value.type;
    return value.value.map((v) => ({ type: unwrappedType, value: v }));
};
export const scalarDefaults = {
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
