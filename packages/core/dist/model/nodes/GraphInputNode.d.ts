import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl } from '../NodeImpl';
import { DataType, DataValue } from '../DataValue';
import { Inputs } from '../GraphProcessor';
import { InternalProcessContext } from '../ProcessContext';
export type GraphInputNode = ChartNode<'graphInput', GraphInputNodeData>;
export type GraphInputNodeData = {
    id: string;
    dataType: DataType;
    defaultValue?: unknown;
    useDefaultValueInput?: boolean;
};
export declare class GraphInputNodeImpl extends NodeImpl<GraphInputNode> {
    static create(id?: string, dataType?: DataType): GraphInputNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    getEditors(): EditorDefinition<GraphInputNode>[];
    process(inputs: Inputs, context: InternalProcessContext): Promise<Record<string, DataValue>>;
}
export declare const graphInputNode: import("../NodeImpl").NodeDefinition<GraphInputNode>;
