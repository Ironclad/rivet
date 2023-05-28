import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { InternalProcessContext, NodeImpl } from '../NodeImpl';
import { DataType } from '../DataValue';
import { Inputs, Outputs } from '../GraphProcessor';
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
