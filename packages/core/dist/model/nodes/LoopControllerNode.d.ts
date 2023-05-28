import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { InternalProcessContext, NodeImpl } from '../NodeImpl';
import { Inputs, Outputs } from '../GraphProcessor';
export type LoopControllerNode = ChartNode<'loopController', LoopControllerNodeData>;
export type LoopControllerNodeData = {
    maxIterations?: number;
};
export declare class LoopControllerNodeImpl extends NodeImpl<LoopControllerNode> {
    #private;
    static create(): LoopControllerNode;
    getInputDefinitions(connections: NodeConnection[], nodes: Record<NodeId, ChartNode>): NodeInputDefinition[];
    getOutputDefinitions(connections: NodeConnection[], nodes: Record<NodeId, ChartNode>): NodeOutputDefinition[];
    process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs>;
}
