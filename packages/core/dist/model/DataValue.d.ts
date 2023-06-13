export type DataValueDef<Type extends string, RuntimeType> = {
    type: Type;
    value: RuntimeType;
};
export type StringDataValue = DataValueDef<'string', string>;
export type NumberDataValue = DataValueDef<'number', number>;
export type BoolDataValue = DataValueDef<'boolean', boolean>;
export type ChatMessage = {
    type: 'system' | 'user' | 'assistant' | 'tool';
    message: string;
};
export type ChatMessageDataValue = DataValueDef<'chat-message', ChatMessage>;
export type DateDataValue = DataValueDef<'date', string>;
export type TimeDataValue = DataValueDef<'time', string>;
export type DateTimeDataValue = DataValueDef<'datetime', string>;
export type AnyDataValue = DataValueDef<'any', unknown>;
export type ObjectDataValue = DataValueDef<'object', Record<string, unknown>>;
export type VectorDataValue = DataValueDef<'vector', number[]>;
/** GPT tool definition */
export type GptTool = {
    name: string;
    namespace?: string;
    description: string;
    schema: object;
};
export type GptToolDataValue = DataValueDef<'gpt-tool', GptTool>;
export type ControlFlowExcludedDataValue = DataValueDef<'control-flow-excluded', undefined | 'loop-not-broken'>;
export type ScalarDataValue = StringDataValue | NumberDataValue | DateDataValue | TimeDataValue | DateTimeDataValue | BoolDataValue | ChatMessageDataValue | ControlFlowExcludedDataValue | AnyDataValue | ObjectDataValue | GptToolDataValue | VectorDataValue;
export type ScalarType = ScalarDataValue['type'];
export type ArrayDataValue<T extends ScalarDataValue> = DataValueDef<`${T['type']}[]`, T['value'][]>;
export type FunctionDataValue<T extends ScalarOrArrayDataValue> = DataValueDef<`fn<${T['type']}>`, () => T['value']>;
export type StringArrayDataValue = ArrayDataValue<StringDataValue>;
export type ArrayDataValues = {
    [P in ScalarDataValue['type']]: ArrayDataValue<Extract<ScalarDataValue, {
        type: P;
    }>>;
}[ScalarDataValue['type']];
export type ScalarOrArrayDataValue = ScalarDataValue | ArrayDataValues;
export type FunctionDataValues = {
    [P in ScalarOrArrayDataValue['type']]: FunctionDataValue<Extract<ScalarOrArrayDataValue, {
        type: P;
    }>>;
}[ScalarOrArrayDataValue['type']];
export type DataValue = ScalarDataValue | ArrayDataValues | FunctionDataValues;
export type DataType = DataValue['type'];
export type ScalarDataType = ScalarDataValue['type'];
export type ArrayDataType = ArrayDataValues['type'];
export type FunctionDataType = FunctionDataValues['type'];
export type ScalarOrArrayDataType = ScalarOrArrayDataValue['type'];
export type GetDataValue<Type extends DataType> = Extract<DataValue, {
    type: Type;
}>;
export declare const dataTypes: ["any", "any[]", "boolean", "boolean[]", "string", "string[]", "number", "number[]", "date", "date[]", "time", "time[]", "datetime", "datetime[]", "chat-message", "chat-message[]", "control-flow-excluded", "control-flow-excluded[]", "object", "object[]", "fn<string>", "fn<number>", "fn<boolean>", "fn<date>", "fn<time>", "fn<datetime>", "fn<any>", "fn<object>", "fn<chat-message>", "fn<control-flow-excluded>", "fn<string[]>", "fn<number[]>", "fn<boolean[]>", "fn<date[]>", "fn<time[]>", "fn<datetime[]>", "fn<any[]>", "fn<object[]>", "fn<chat-message[]>", "fn<control-flow-excluded[]>", "gpt-tool", "gpt-tool[]", "fn<gpt-tool[]>", "fn<gpt-tool>", "vector", "vector[]", "fn<vector>", "fn<vector[]>"];
export declare const scalarTypes: ["any", "boolean", "string", "number", "date", "time", "datetime", "chat-message", "control-flow-excluded", "object", "gpt-tool", "vector"];
export declare const dataTypeDisplayNames: Record<DataType, string>;
export declare function isScalarDataValue(value: DataValue | undefined): value is ScalarDataValue;
export declare function isScalarDataType(type: DataType): type is ScalarDataType;
export declare function isArrayDataValue(value: DataValue | undefined): value is ArrayDataValues;
export declare function isArrayDataType(type: DataType): type is ArrayDataType;
export declare function isFunctionDataType(type: DataType): type is FunctionDataType;
export declare function isFunctionDataValue(value: DataValue | undefined): value is FunctionDataValues;
export declare function isNotFunctionDataValue(value: DataValue | undefined): value is ScalarOrArrayDataValue;
export declare function functionTypeToScalarType(functionType: FunctionDataType): ScalarDataType;
export declare function arrayTypeToScalarType(arrayType: ArrayDataType): ScalarDataType;
export declare function getScalarTypeOf(type: DataType): ScalarDataType;
/** Unwraps a potentially function data value to a concrete value. I.e., evaluates on-demand values. */
export declare function unwrapDataValue(value: DataValue): ScalarOrArrayDataValue;
/**
 * Turns a { type: 'string[]', value: string[] } into { type: 'string', value: string }[]
 * or a { type: 'object', value: something[] } into { type: 'object', value: something }[]
 * or a { type: 'any', value: something[] } into { type: 'any', value: something }[]
 * or a { type: 'string', value: string } into [{ type: 'string', value: string }]
 */
export declare const arrayizeDataValue: (value: ScalarOrArrayDataValue) => ScalarDataValue[];
export declare const scalarDefaults: {
    [P in ScalarDataType]: Extract<ScalarDataValue, {
        type: P;
    }>['value'];
};
export declare function getDefaultValue<T extends DataType>(type: T): (DataValue & {
    type: T;
})['value'];
