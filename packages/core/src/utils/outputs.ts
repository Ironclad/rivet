import type { Outputs } from '../index.js';
import type { ArrayDataValue, StringDataValue } from '../model/DataValue.js';
import { expectType } from './expectType.js';
import { WarningsPort } from './symbols.js';

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
