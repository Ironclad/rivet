import { NodeImpl } from '../NodeImpl';
import { ChartNode, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase';
import { DataValue } from '../DataValue';
export type IfElseNode = ChartNode<'ifElse', IfElseNodeData>;
export type IfElseNodeData = {};
export declare class IfElseNodeImpl extends NodeImpl<ChartNode> {
    static create: () => IfElseNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    process(inputData: Record<PortId, DataValue>): Promise<Record<PortId, DataValue>>;
}
