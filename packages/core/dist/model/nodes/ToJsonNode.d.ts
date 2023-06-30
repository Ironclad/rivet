import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl } from '../NodeImpl';
import { Inputs, Outputs } from '../GraphProcessor';
export type ToJsonNode = ChartNode<'toJson', ToJsonNodeData>;
export type ToJsonNodeData = {
    indented?: boolean;
};
export declare class ToJsonNodeImpl extends NodeImpl<ToJsonNode> {
    static create(): ToJsonNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    getEditors(): EditorDefinition<ToJsonNode>[];
    getBody(): string | undefined;
    process(inputs: Inputs): Promise<Outputs>;
}
export declare const toJsonNode: import("../NodeImpl").NodeDefinition<ToJsonNode>;
