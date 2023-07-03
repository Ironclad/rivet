import { ChartNode, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl } from '../NodeImpl';
import { DataValue } from '../DataValue';
export type ExtractYamlNode = ChartNode<'extractYaml', ExtractYamlNodeData>;
export type ExtractYamlNodeData = {
    rootPropertyName: string;
    objectPath?: string;
};
export declare class ExtractYamlNodeImpl extends NodeImpl<ExtractYamlNode> {
    static create(): ExtractYamlNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    getEditors(): EditorDefinition<ExtractYamlNode>[];
    process(inputs: Record<PortId, DataValue>): Promise<Record<PortId, DataValue>>;
}
export declare const extractYamlNode: import("../NodeImpl").NodeDefinition<ExtractYamlNode>;
