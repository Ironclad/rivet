import { ChartNode } from '../../model/NodeBase';
import { EditorDefinition, NodeImpl } from '../../model/NodeImpl';
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
    getEditors(): EditorDefinition<ChunkNode>[];
    process(inputs: Record<PortId, DataValue>): Promise<Record<PortId, DataValue>>;
}
export declare const chunkNode: import("../../model/NodeImpl").NodeDefinition<ChunkNode>;
