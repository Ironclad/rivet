import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { InternalProcessContext, NodeImpl } from '../NodeImpl';
import { Inputs, Outputs } from '../GraphProcessor';
import { GraphId } from '../NodeGraph';
import { Project } from '../Project';
export type SubGraphNode = ChartNode & {
    type: 'subGraph';
    data: {
        graphId: GraphId;
    };
};
export declare class SubGraphNodeImpl extends NodeImpl<SubGraphNode> {
    static create(): SubGraphNode;
    process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs>;
    getInputDefinitions(_connections: NodeConnection[], _nodes: Record<NodeId, ChartNode>, project: Project): NodeInputDefinition[];
    getOutputDefinitions(_connections: NodeConnection[], _nodes: Record<NodeId, ChartNode>, project: Project): NodeOutputDefinition[];
    getInputValues(inputs: Inputs): Record<string, any>;
    getOutputValues(subGraphOutputs: Record<string, any>): Outputs;
}
