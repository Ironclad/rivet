import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl } from '../NodeImpl';
import { Inputs, Outputs } from '../GraphProcessor';
import { InternalProcessContext } from '../ProcessContext';
export type LoopControllerNode = ChartNode<'loopController', LoopControllerNodeData>;
export type LoopControllerNodeData = {
    maxIterations?: number;
};
export declare class LoopControllerNodeImpl extends NodeImpl<LoopControllerNode> {
    #private;
    static create(): LoopControllerNode;
    getInputDefinitions(connections: NodeConnection[], nodes: Record<NodeId, ChartNode>): NodeInputDefinition[];
    getOutputDefinitions(connections: NodeConnection[], nodes: Record<NodeId, ChartNode>): NodeOutputDefinition[];
    getEditors(): EditorDefinition<LoopControllerNode>[];
    process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs>;
}
export declare const loopControllerNode: import("../NodeImpl").NodeDefinition<LoopControllerNode>;
