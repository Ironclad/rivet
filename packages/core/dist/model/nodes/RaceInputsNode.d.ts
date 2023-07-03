import { ChartNode, NodeInputDefinition, NodeOutputDefinition, NodeConnection } from '../NodeBase';
import { EditorDefinition, NodeImpl } from '../NodeImpl';
import { Inputs, Outputs } from '../GraphProcessor';
import { InternalProcessContext } from '../ProcessContext';
export type RaceInputsNode = ChartNode<'raceInputs', RaceInputsNodeData>;
export type RaceInputsNodeData = {};
export declare class RaceInputsNodeImpl extends NodeImpl<RaceInputsNode> {
    #private;
    static create(): RaceInputsNode;
    getInputDefinitions(connections: NodeConnection[]): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    getEditors(): EditorDefinition<RaceInputsNode>[];
    process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs>;
}
export declare const raceInputsNode: import("../NodeImpl").NodeDefinition<RaceInputsNode>;
