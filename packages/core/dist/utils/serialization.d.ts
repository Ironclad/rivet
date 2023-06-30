import { NodeGraph, Project } from '..';
export declare function serializeProject(project: Project): unknown;
export declare function deserializeProject(serializedProject: unknown): Project;
export declare function serializeGraph(graph: NodeGraph): unknown;
export declare function deserializeGraph(serializedGraph: unknown): NodeGraph;
