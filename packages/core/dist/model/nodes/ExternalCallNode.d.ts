import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { InternalProcessContext, NodeImpl } from '../NodeImpl';
import { Inputs, Outputs } from '../GraphProcessor';
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
    process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs>;
}
