import { ChartNode, NodeConnection, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { NodeImpl } from '../NodeImpl';
import { Inputs, Outputs } from '../GraphProcessor';
export type AssemblePromptNode = ChartNode<'assemblePrompt', AssemblePromptNodeData>;
export type AssemblePromptNodeData = {};
export declare class AssemblePromptNodeImpl extends NodeImpl<AssemblePromptNode> {
    #private;
    static create(): AssemblePromptNode;
    getInputDefinitions(connections: NodeConnection[]): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    process(inputs: Inputs): Promise<Outputs>;
}
