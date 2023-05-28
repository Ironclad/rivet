import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { NodeImpl } from '../NodeImpl';
import { DataType, DataValue } from '../DataValue';
import { GraphInputs, Inputs, Outputs } from '../GraphProcessor';
export type GraphInputNode = ChartNode<'graphInput', GraphInputNodeData>;
export type GraphInputNodeData = {
    id: string;
    dataType: DataType;
    defaultValue?: unknown;
    useDefaultValueInput?: boolean;
};
export declare class GraphInputNodeImpl extends NodeImpl<GraphInputNode> {
    static create(id?: string, dataType?: DataType): GraphInputNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    process(): Promise<Record<string, DataValue>>;
    getOutputValuesFromGraphInput(graphInputs: GraphInputs, nodeInputs: Inputs): Promise<Outputs>;
}
