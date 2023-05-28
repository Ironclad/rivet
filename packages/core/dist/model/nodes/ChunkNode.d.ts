import { ChartNode } from '../../model/NodeBase';
import { NodeImpl } from '../../model/NodeImpl';
import { NodeInputDefinition, NodeOutputDefinition, PortId } from '../../model/NodeBase';
import { DataValue } from '../../model/DataValue';
export type ChunkNodeData = {
    numTokensPerChunk: number;
    model: string;
    useModelInput: boolean;
    overlap: number;
};
export type ChunkNode = ChartNode<'chunk', ChunkNodeData>;
export declare class ChunkNodeImpl extends NodeImpl<ChunkNode> {
    static create(): ChunkNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    process(inputs: Record<PortId, DataValue>): Promise<Record<PortId, DataValue>>;
}
