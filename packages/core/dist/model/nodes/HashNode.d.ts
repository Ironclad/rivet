import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl } from '../NodeImpl';
import { Inputs, Outputs } from '../..';
export type HashNode = ChartNode<'hash', HashNodeData>;
export type HashNodeData = {
    algorithm: 'md5' | 'sha1' | 'sha256' | 'sha512';
};
export declare class HashNodeImpl extends NodeImpl<HashNode> {
    static create(): HashNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    getEditors(): EditorDefinition<HashNode>[];
    getBody(): string | undefined;
    process(inputs: Inputs): Promise<Outputs>;
}
export declare const hashNode: import("../NodeImpl").NodeDefinition<HashNode>;
