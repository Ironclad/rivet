import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { NodeImpl } from '../NodeImpl';
import { Inputs, Outputs } from '../GraphProcessor';
export type PopNode = ChartNode<'pop', {}>;
export declare class PopNodeImpl extends NodeImpl<PopNode> {
    static create(): PopNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    process(inputs: Inputs): Promise<Outputs>;
}
