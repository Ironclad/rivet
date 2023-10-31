import { isArrayDataType, type DataType } from '../model/DataValue.js';

export function isDataTypeAccepted(
  inputType: DataType | Readonly<DataType[]>,
  accepted: DataType | Readonly<DataType[]>,
) {
  inputType = Array.isArray(inputType) ? inputType : [inputType];
  accepted = Array.isArray(accepted) ? accepted : [accepted];

  for (const input of inputType) {
    for (const accept of accepted) {
      if (isDataTypeCompatible(input, accept)) {
        return true;
      }
    }
  }

  return false;
}

export function isDataTypeCompatible(inputType: DataType, accepted: DataType): boolean {
  // Any is always compatible on either side
  if (inputType === 'any' || accepted === 'any') {
    return true;
  }

  // If they're both arrays, and either is 'any[]', it's compatible
  if (isArrayDataType(inputType) && isArrayDataType(accepted) && (inputType === 'any[]' || accepted === 'any[]')) {
    return true;
  }

  if (inputType === accepted) {
    return true;
  }

  return false;
}
