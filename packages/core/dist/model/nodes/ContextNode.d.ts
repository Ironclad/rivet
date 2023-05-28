import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { InternalProcessContext, NodeImpl } from '../NodeImpl';
import { DataType } from '../DataValue';
import { Inputs, Outputs } from '../GraphProcessor';
export type ContextNode = ChartNode<'context', ContextNodeData>;
export type ContextNodeData = {
    id: string;
    dataType: DataType;
    defaultValue?: unknown;
    useDefaultValueInput?: boolean;
};
export declare class ContextNodeImpl extends NodeImpl<ContextNode> {
    static create(id?: string, dataType?: DataType): ContextNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs>;
}
