import { ChartNode, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { NodeImpl } from '../NodeImpl';
import { DataValue } from '../DataValue';
export type ExtractJsonNode = ChartNode<'extractJson', ExtractJsonNodeData>;
export type ExtractJsonNodeData = {};
export declare class ExtractJsonNodeImpl extends NodeImpl<ExtractJsonNode> {
    static create(): ExtractJsonNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    process(inputs: Record<PortId, DataValue>): Promise<Record<PortId, DataValue>>;
}
