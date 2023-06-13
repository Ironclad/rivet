import { ChartNode, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl } from '../NodeImpl';
import { DataValue } from '../DataValue';
export type ExtractObjectPathNode = ChartNode<'extractObjectPath', ExtractObjectPathNodeData>;
export type ExtractObjectPathNodeData = {
    path: string;
    usePathInput: boolean;
};
export declare class ExtractObjectPathNodeImpl extends NodeImpl<ExtractObjectPathNode> {
    static create(): ExtractObjectPathNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    getEditors(): EditorDefinition<ExtractObjectPathNode>[];
    process(inputs: Record<PortId, DataValue>): Promise<Record<PortId, DataValue>>;
}
export declare const extractObjectPathNode: import("../NodeImpl").NodeDefinition<ExtractObjectPathNode>;
