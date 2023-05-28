import { ChartNode, NodeOutputDefinition, PortId, NodeInputDefinition } from '../NodeBase';
import { NodeImpl } from '../NodeImpl';
import { DataType, DataValue } from '../DataValue';
export type GraphOutputNode = ChartNode<'graphOutput', GraphOutputNodeData>;
export type GraphOutputNodeData = {
    id: string;
    dataType: DataType;
};
export declare class GraphOutputNodeImpl extends NodeImpl<GraphOutputNode> {
    static create(id?: string, dataType?: DataType): GraphOutputNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    process(): Promise<Record<PortId, DataValue>>;
}
