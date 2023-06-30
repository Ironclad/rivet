import { EditorDefinition, NodeImpl } from '../NodeImpl';
import { ChartNode, NodeConnection, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { Inputs, Outputs } from '../GraphProcessor';
export type JoinNode = ChartNode<'join', JoinNodeData>;
export type JoinNodeData = {
    flatten?: boolean;
    joinString: string;
    useJoinStringInput?: boolean;
};
export declare class JoinNodeImpl extends NodeImpl<JoinNode> {
    #private;
    static create: () => JoinNode;
    getInputDefinitions(connections: NodeConnection[]): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    getEditors(): EditorDefinition<JoinNode>[];
    getBody(): string | undefined;
    process(inputs: Inputs): Promise<Outputs>;
}
export declare const joinNode: import("../NodeImpl").NodeDefinition<JoinNode>;
