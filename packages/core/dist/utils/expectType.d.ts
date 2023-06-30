import { DataType, DataValue, GetDataValue } from '../model/DataValue';
export declare function expectType<T extends DataType>(value: DataValue | undefined, type: T): GetDataValue<T>['value'];
export declare function expectTypeOptional<T extends DataType>(value: DataValue | undefined, type: T): GetDataValue<T>['value'] | undefined;
