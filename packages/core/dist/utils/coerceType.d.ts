import { DataType, DataValue, GetDataValue } from '../model/DataValue';
export declare function coerceTypeOptional<T extends DataType>(wrapped: DataValue | undefined, type: T): GetDataValue<T>['value'] | undefined;
export declare function coerceType<T extends DataType>(value: DataValue | undefined, type: T): GetDataValue<T>['value'];
export declare function inferType(value: unknown): DataValue;
