import { Outputs, expectType } from '..';
import { ArrayDataValue, StringDataValue } from '../model/DataValue';
import { WarningsPort } from './symbols';

export function addWarning(outputs: Outputs, warning: string): void {
  if (!outputs[WarningsPort]) {
    outputs[WarningsPort] = { type: 'string[]', value: [] };
  }

  (outputs[WarningsPort] as ArrayDataValue<StringDataValue>).value.push(warning);
}

export function getWarnings(outputs: Outputs | undefined): string[] | undefined {
  if (!outputs?.[WarningsPort]) {
    return undefined;
  }

  return expectType(outputs[WarningsPort], 'string[]');
}
