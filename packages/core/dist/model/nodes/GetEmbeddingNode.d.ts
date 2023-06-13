import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl } from '../NodeImpl';
import { Inputs, Outputs } from '../GraphProcessor';
import { InternalProcessContext } from '../ProcessContext';
export type GetEmbeddingNode = ChartNode<'getEmbedding', GetEmbeddingNodeData>;
export type GetEmbeddingNodeData = {
    integration: string;
    useIntegrationInput?: boolean;
};
export declare class GetEmbeddingNodeImpl extends NodeImpl<GetEmbeddingNode> {
    static create(): GetEmbeddingNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    getEditors(): EditorDefinition<GetEmbeddingNode>[];
    getBody(): string | undefined;
    process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs>;
}
export declare const getEmbeddingNode: import("../NodeImpl").NodeDefinition<GetEmbeddingNode>;
