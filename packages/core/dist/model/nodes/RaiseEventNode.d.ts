import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl } from '../NodeImpl';
import { DataValue } from '../DataValue';
import { Inputs } from '../GraphProcessor';
import { InternalProcessContext } from '../ProcessContext';
export type RaiseEventNode = ChartNode<'raiseEvent', RaiseEventNodeData>;
export type RaiseEventNodeData = {
    eventName: string;
    useEventNameInput: boolean;
};
export declare class RaiseEventNodeImpl extends NodeImpl<RaiseEventNode> {
    static create(): RaiseEventNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    getEditors(): EditorDefinition<RaiseEventNode>[];
    process(inputs: Inputs, context: InternalProcessContext): Promise<Record<string, DataValue>>;
}
export declare const raiseEventNode: import("../NodeImpl").NodeDefinition<RaiseEventNode>;
