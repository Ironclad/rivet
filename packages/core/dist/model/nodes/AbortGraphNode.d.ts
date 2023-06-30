import { ChartNode, NodeOutputDefinition, NodeInputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl } from '../NodeImpl';
import { Inputs, Outputs } from '../GraphProcessor';
import { InternalProcessContext } from '../ProcessContext';
export type AbortGraphNode = ChartNode<'abortGraph', AbortGraphNodeData>;
export type AbortGraphNodeData = {
    /** Did the graph abort, but it's a success? Use this for early-exit instead of "error abort". */
    successfully: boolean;
    useSuccessfullyInput?: boolean;
    errorMessage?: string;
};
export declare class AbortGraphNodeImpl extends NodeImpl<AbortGraphNode> {
    static create(): AbortGraphNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    getEditors(): EditorDefinition<AbortGraphNode>[];
    getBody(): string | undefined;
    process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs>;
}
export declare const abortGraphNode: import("../NodeImpl").NodeDefinition<AbortGraphNode>;
