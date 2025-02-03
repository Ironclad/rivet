import { mapValues } from 'lodash-es';
import type { DataValue } from '../model/DataValue.js';

export type LooseDataValue = DataValue | string | number | boolean;

export function looseDataValuesToDataValues(values: Record<string, LooseDataValue>): Record<string, DataValue> {
  return mapValues(values, (val) => looseDataValueToDataValue(val));
}

export function looseDataValueToDataValue(value: LooseDataValue): DataValue {
  if (typeof value === 'string') {
    return { type: 'string', value };
  }

  if (typeof value === 'number') {
    return { type: 'number', value };
  }

  if (typeof value === 'boolean') {
    return { type: 'boolean', value };
  }

  return value;
}
