import { ChartNode, PortId, NodeInputDefinition, NodeOutputDefinition } from '../../model/NodeBase';
import { NodeImpl } from '../../model/NodeImpl';
import { DataValue } from '../../model/DataValue';
import { SupportedModels } from '../../utils/tokenizer';
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
    process(inputs: Record<PortId, DataValue>): Promise<Record<PortId, DataValue>>;
}
