import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl } from '../NodeImpl';
import { DataValue } from '../DataValue';
export type ToolNode = ChartNode<'tool', ToolNodeData>;
export type ToolNodeData = {
    name: string;
    description: string;
    namespace?: string;
    schema: string;
};
export declare class ToolNodeImpl extends NodeImpl<ToolNode> {
    static create(): ToolNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    getEditors(): EditorDefinition<ToolNode>[];
    process(inputs: Record<string, DataValue>): Promise<Record<string, DataValue>>;
}
export declare const toolNode: import("../NodeImpl").NodeDefinition<ToolNode>;
