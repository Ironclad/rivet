import { ChartNode, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { NodeImpl } from '../NodeImpl';
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
    process(inputs: Record<PortId, DataValue>): Promise<Record<PortId, DataValue>>;
}
