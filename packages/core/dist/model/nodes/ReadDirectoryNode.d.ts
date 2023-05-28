import { ChartNode } from '../NodeBase';
import { NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { InternalProcessContext, NodeImpl } from '../NodeImpl';
import { Inputs, Outputs } from '../GraphProcessor';
export type ReadDirectoryNode = ChartNode<'readDirectory', ReadDirectoryNodeData>;
type ReadDirectoryNodeData = {
    path: string;
    usePathInput: boolean;
    recursive: boolean;
    useRecursiveInput: boolean;
    includeDirectories: boolean;
    useIncludeDirectoriesInput: boolean;
    filterGlobs: string[];
    useFilterGlobsInput: boolean;
    relative: boolean;
    useRelativeInput: boolean;
    ignores?: string[];
    useIgnoresInput: boolean;
};
export declare class ReadDirectoryNodeImpl extends NodeImpl<ReadDirectoryNode> {
    static create(): ReadDirectoryNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    process(inputData: Inputs, context: InternalProcessContext): Promise<Outputs>;
}
export {};
