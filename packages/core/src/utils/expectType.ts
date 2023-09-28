import {
  type DataType,
  type DataValue,
  type GetDataValue,
  getScalarTypeOf,
  isArrayDataType,
  isFunctionDataType,
  isScalarDataValue,
  unwrapDataValue,
} from '../model/DataValue.js';

export function expectType<T extends DataType>(value: DataValue | undefined, type: T): GetDataValue<T>['value'] {
  // Allow a string to be expected for a string[], just return an array of one element
  if (isArrayDataType(type) && isScalarDataValue(value) && getScalarTypeOf(type) === value.type) {
    return [value.value] as GetDataValue<T>['value'];
  }

  if (type === 'any' || type === 'any[]' || value?.type === 'any' || value?.type === 'any[]') {
    return value?.value as GetDataValue<T>['value'];
  }

  if ((isFunctionDataType(type) && value?.type === `fn<${type}>`) || type === 'fn<any>') {
    return (() => value!.value) as GetDataValue<T>['value'];
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

  // Allow a string to be expected for a string[], just return an array of one element
  if (isArrayDataType(type) && isScalarDataValue(value) && getScalarTypeOf(type) === value.type) {
    return [value.value] as GetDataValue<T>['value'] | undefined;
  }

  // We allow a fn<string> to be expected for a string, so unwrap it on demand
  if (isFunctionDataType(value.type) && value.type === `fn<${type}>`) {
    value = unwrapDataValue(value);
  }

  if (value.type !== type) {
    throw new Error(`Expected value of type ${type} but got ${value?.type}`);
  }
  return value.value as GetDataValue<T>['value'] | undefined;
}
