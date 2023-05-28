import { ChartNode, PortId } from '../NodeBase';
import { NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { DataValue } from '../DataValue';
import { NodeImpl, ProcessContext } from '../NodeImpl';
export type ReadFileNode = ChartNode<'readFile', ReadFileNodeData>;
type ReadFileNodeData = {
    path: string;
    usePathInput: boolean;
    errorOnMissingFile?: boolean;
};
export declare class ReadFileNodeImpl extends NodeImpl<ReadFileNode> {
    static create(): ReadFileNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    process(inputData: Record<PortId, DataValue>, context: ProcessContext): Promise<Record<PortId, DataValue>>;
}
export {};
