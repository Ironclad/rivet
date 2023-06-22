import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl } from '../NodeImpl';
import { DataType } from '../DataValue';
import { Inputs, Outputs } from '../GraphProcessor';
import { InternalProcessContext } from '../ProcessContext';
export type ContextNode = ChartNode<'context', ContextNodeData>;
export type ContextNodeData = {
    id: string;
    dataType: DataType;
    defaultValue?: unknown;
    useDefaultValueInput?: boolean;
};
export declare class ContextNodeImpl extends NodeImpl<ContextNode> {
    static create(id?: string, dataType?: DataType): ContextNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    getEditors(): EditorDefinition<ContextNode>[];
    process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs>;
}
export declare const contextNode: import("../NodeImpl").NodeDefinition<ContextNode>;
