import { NodeImpl } from '../NodeImpl';
import { ChartNode, NodeConnection, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { DataValue } from '../DataValue';
export type IfNode = ChartNode<'if', IfNodeData>;
export type IfNodeData = {};
export declare class IfNodeImpl extends NodeImpl<ChartNode> {
    static create: () => IfNode;
    getInputDefinitions(connections: NodeConnection[]): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    process(inputData: Record<string, DataValue>): Promise<Record<string, DataValue>>;
}
