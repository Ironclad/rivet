import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl } from '../NodeImpl';
import { Inputs, Outputs } from '../GraphProcessor';
import { InternalProcessContext } from '../ProcessContext';
export type VectorStoreNode = ChartNode<'vectorStore', VectorStoreNodeData>;
export type VectorStoreNodeData = {
    integration: string;
    useIntegrationInput?: boolean;
    collectionId: string;
    useCollectionIdInput?: boolean;
};
export declare class VectorStoreNodeImpl extends NodeImpl<VectorStoreNode> {
    static create(): VectorStoreNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    getEditors(): EditorDefinition<VectorStoreNode>[];
    getBody(): string | undefined;
    process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs>;
}
export declare const vectorStoreNode: import("../NodeImpl").NodeDefinition<VectorStoreNode>;
