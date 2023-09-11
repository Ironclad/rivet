import { DataType, GetDataValue, Inputs, PortId, coerceTypeOptional } from '../index.js';

export function getInputOrData<Data extends object, T extends DataType = 'string'>(
  data: Data,
  inputs: Inputs,
  inputAndDataKey: keyof Data & string,
  type?: T,
  useInputToggleDataKey?: keyof Data & string,
): GetDataValue<T>['value'] {
  if (!useInputToggleDataKey) {
    const capitalized = inputAndDataKey[0]!.toUpperCase() + inputAndDataKey.slice(1);
    const key = `use${capitalized}Input` as keyof Data & string;
    useInputToggleDataKey = key;
  }
  const value = data[useInputToggleDataKey]
    ? coerceTypeOptional(inputs[inputAndDataKey as PortId], type ?? 'string') ?? data[inputAndDataKey]
    : data[inputAndDataKey];
  return value as GetDataValue<T>['value'];
}
