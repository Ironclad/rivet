import { ChartNode, NodeOutputDefinition, NodeInputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl } from '../NodeImpl';
import { DataType } from '../DataValue';
import { Inputs, Outputs } from '../GraphProcessor';
import { InternalProcessContext } from '../ProcessContext';
export type GraphOutputNode = ChartNode<'graphOutput', GraphOutputNodeData>;
export type GraphOutputNodeData = {
    id: string;
    dataType: DataType;
};
export declare class GraphOutputNodeImpl extends NodeImpl<GraphOutputNode> {
    static create(id?: string, dataType?: DataType): GraphOutputNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    getEditors(): EditorDefinition<GraphOutputNode>[];
    process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs>;
}
export declare const graphOutputNode: import("../NodeImpl").NodeDefinition<GraphOutputNode>;
