import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl } from '../NodeImpl';
import { Inputs, Outputs } from '../GraphProcessor';
import { InternalProcessContext } from '../ProcessContext';
export type ExternalCallNode = ChartNode<'externalCall', ExternalCallNodeData>;
export type ExternalCallNodeData = {
    functionName: string;
    useFunctionNameInput: boolean;
    useErrorOutput: boolean;
};
export declare class ExternalCallNodeImpl extends NodeImpl<ExternalCallNode> {
    static create(): ExternalCallNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    getEditors(): EditorDefinition<ExternalCallNode>[];
    process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs>;
}
export declare const externalCallNode: import("../NodeImpl").NodeDefinition<ExternalCallNode>;
