import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl } from '../NodeImpl';
import { Inputs, Outputs } from '../GraphProcessor';
import { InternalProcessContext } from '../ProcessContext';
export type WaitForEventNode = ChartNode<'waitForEvent', WaitForEventNodeData>;
export type WaitForEventNodeData = {
    eventName: string;
    useEventNameInput: boolean;
};
export declare class WaitForEventNodeImpl extends NodeImpl<WaitForEventNode> {
    static create(): WaitForEventNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    getEditors(): EditorDefinition<WaitForEventNode>[];
    process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs>;
}
export declare const waitForEventNode: import("../NodeImpl").NodeDefinition<WaitForEventNode>;
