import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../../model/NodeBase';
import { EditorDefinition, NodeImpl } from '../../model/NodeImpl';
import { SupportedModels } from '../../utils/tokenizer';
import { Inputs, Outputs } from '../..';
export type TrimChatMessagesNodeData = {
    maxTokenCount: number;
    removeFromBeginning: boolean;
    model: SupportedModels;
};
export type TrimChatMessagesNode = ChartNode<'trimChatMessages', TrimChatMessagesNodeData>;
export declare class TrimChatMessagesNodeImpl extends NodeImpl<TrimChatMessagesNode> {
    static create(): TrimChatMessagesNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    getEditors(): EditorDefinition<TrimChatMessagesNode>[];
    process(inputs: Inputs): Promise<Outputs>;
}
export declare const trimChatMessagesNode: import("../..").NodeDefinition<TrimChatMessagesNode>;
