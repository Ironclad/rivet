import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl } from '../NodeImpl';
import { DataValue } from '../DataValue';
export type TextNode = ChartNode<'text', TextNodeData>;
export type TextNodeData = {
    text: string;
};
export declare class TextNodeImpl extends NodeImpl<TextNode> {
    static create(text?: string): TextNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    getEditors(): EditorDefinition<TextNode>[];
    interpolate(baseString: string, values: Record<string, any>): string;
    process(inputs: Record<string, DataValue>): Promise<Record<string, DataValue>>;
}
export declare const textNode: import("../NodeImpl").NodeDefinition<TextNode>;
