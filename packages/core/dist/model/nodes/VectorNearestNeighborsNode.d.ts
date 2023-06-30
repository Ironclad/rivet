import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl } from '../NodeImpl';
import { Inputs, Outputs } from '../GraphProcessor';
import { InternalProcessContext } from '../ProcessContext';
export type VectorNearestNeighborsNode = ChartNode<'vectorNearestNeighbors', VectorNearestNeighborsNodeData>;
export type VectorNearestNeighborsNodeData = {
    integration: string;
    useIntegrationInput?: boolean;
    k: number;
    useKInput?: boolean;
    collectionId: string;
    useCollectionIdInput?: boolean;
};
export declare class VectorNearestNeighborsNodeImpl extends NodeImpl<VectorNearestNeighborsNode> {
    static create(): VectorNearestNeighborsNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    getEditors(): EditorDefinition<VectorNearestNeighborsNode>[];
    getBody(): string | undefined;
    process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs>;
}
export declare const vectorNearestNeighborsNode: import("../NodeImpl").NodeDefinition<VectorNearestNeighborsNode>;
