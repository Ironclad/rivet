import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { NodeImpl } from '../NodeImpl';
import { DataValue } from '../DataValue';
export type MatchNode = ChartNode<'match', MatchNodeData>;
export type MatchNodeData = {
    caseCount: number;
    cases: string[];
};
export declare class MatchNodeImpl extends NodeImpl<MatchNode> {
    static create(caseCount?: number, cases?: string[]): MatchNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    process(inputs: Record<string, DataValue>): Promise<Record<string, DataValue>>;
}
export declare const matchNode: import("../NodeImpl").NodeDefinition<MatchNode>;
