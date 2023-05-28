import { getScalarTypeOf, isArrayDataType, isFunctionDataType, isScalarDataValue, unwrapDataValue, } from '../model/DataValue';
export function expectType(value, type) {
    // Allow a string to be expected for a string[], just return an array of one element
    if (isArrayDataType(type) && isScalarDataValue(value) && getScalarTypeOf(type) === value.type) {
        return [value.value];
    }
    if (type === 'any' || type === 'any[]' || value?.type === 'any' || value?.type === 'any[]') {
        return value?.value;
    }
    if ((isFunctionDataType(type) && value?.type === `fn<${type}>`) || type === 'fn<any>') {
        return (() => value.value);
    }
    if (value?.type !== type) {
        throw new Error(`Expected value of type ${type} but got ${value?.type}`);
    }
    return value.value;
}
export function expectTypeOptional(value, type) {
    if (value === undefined) {
        return undefined;
    }
    // We allow a fn<string> to be expected for a string, so unwrap it on demand
    if (isFunctionDataType(value.type) && value.type === `fn<${type}>`) {
        value = unwrapDataValue(value);
    }
    if (value.type !== type) {
        throw new Error(`Expected value of type ${type} but got ${value?.type}`);
    }
    return value.value;
}
