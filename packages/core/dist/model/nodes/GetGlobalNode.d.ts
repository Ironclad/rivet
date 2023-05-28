import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { InternalProcessContext, NodeImpl } from '../NodeImpl';
import { ScalarOrArrayDataType } from '../DataValue';
import { Inputs, Outputs } from '../GraphProcessor';
export type GetGlobalNode = ChartNode<'getGlobal', GetGlobalNodeData>;
export type GetGlobalNodeData = {
    id: string;
    dataType: ScalarOrArrayDataType;
    /**
     * Returns a fn<value> instead of a value, so that the variable is read when nodes need it, rather than when this node executes.
     * The only time you wouldn't want this is to read a global at the start of a subgraph.
     */
    onDemand: boolean;
    /** Wait until the variable is available */
    wait: boolean;
    useIdInput: boolean;
};
export declare class GetGlobalNodeImpl extends NodeImpl<GetGlobalNode> {
    static create(id?: string): GetGlobalNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs>;
}
