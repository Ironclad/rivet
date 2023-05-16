import { DataType, DataValue, GetDataValue } from '../model/DataValue';

export function expectType<T extends DataType>(value: DataValue | undefined, type: T): GetDataValue<T>['value'] {
  if (type.endsWith('[]') && value?.type === 'string') {
    return [value.value] as GetDataValue<T>['value'];
  }

  if (type.endsWith('[]') && value?.type === 'any') {
    return [value.value] as GetDataValue<T>['value'];
  }

  if (type === 'any' || type === 'any[]' || value?.type === 'any' || value?.type === 'any[]') {
    return value?.value as GetDataValue<T>['value'];
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
