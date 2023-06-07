import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl } from '../NodeImpl';
import { ScalarOrArrayDataType } from '../DataValue';
import { Inputs, Outputs } from '../GraphProcessor';
import { InternalProcessContext } from '../ProcessContext';
export type GetGlobalNode = ChartNode<'getGlobal', GetGlobalNodeData>;
export type GetGlobalNodeData = {
    id: string;
    useIdInput: boolean;
    dataType: ScalarOrArrayDataType;
    /**
     * Returns a fn<value> instead of a value, so that the variable is read when nodes need it, rather than when this node executes.
     * The only time you wouldn't want this is to read a global at the start of a subgraph.
     */
    onDemand: boolean;
    /** Wait until the variable is available */
    wait: boolean;
};
export declare class GetGlobalNodeImpl extends NodeImpl<GetGlobalNode> {
    static create(id?: string): GetGlobalNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    getEditors(): EditorDefinition<GetGlobalNode>[];
    process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs>;
}
export declare const getGlobalNode: import("../NodeImpl").NodeDefinition<GetGlobalNode>;
