import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { NodeImpl } from '../NodeImpl';
import { DataType } from '../DataValue';
import { Inputs, Outputs } from '../GraphProcessor';
import { InternalProcessContext } from '../ProcessContext';
export type SetGlobalNode = ChartNode<'setGlobal', SetGlobalNodeData>;
export type SetGlobalNodeData = {
    id: string;
    useIdInput: boolean;
    dataType: DataType;
};
export declare class SetGlobalNodeImpl extends NodeImpl<SetGlobalNode> {
    static create(): SetGlobalNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs>;
}
export declare const setGlobalNode: import("../NodeImpl").NodeDefinition<SetGlobalNode>;
