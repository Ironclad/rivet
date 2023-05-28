import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { InternalProcessContext, NodeImpl } from '../NodeImpl';
import { DataValue } from '../DataValue';
import { Inputs } from '../GraphProcessor';
export type RaiseEventNode = ChartNode<'raiseEvent', RaiseEventNodeData>;
export type RaiseEventNodeData = {
    eventName: string;
    useEventNameInput: boolean;
};
export declare class RaiseEventNodeImpl extends NodeImpl<RaiseEventNode> {
    static create(): RaiseEventNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    process(inputs: Inputs, context: InternalProcessContext): Promise<Record<string, DataValue>>;
}
