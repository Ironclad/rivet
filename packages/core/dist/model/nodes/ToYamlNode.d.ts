import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { NodeDefinition, NodeImpl } from '../NodeImpl';
import { Inputs, Outputs } from '../GraphProcessor';
export type ToYamlNode = ChartNode<'toYaml', ToYamlNodeData>;
export type ToYamlNodeData = {};
export declare class ToYamlNodeImpl extends NodeImpl<ToYamlNode> {
    static create(): ToYamlNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    process(inputs: Inputs): Promise<Outputs>;
}
export declare const toYamlNode: NodeDefinition<ToYamlNode>;
