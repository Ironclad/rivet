import { DataValue, ExternalFunction, GraphProcessor, NativeApi, ProcessEvents, Project, Settings } from './core';
import { NodaiDebuggerServer } from './debugger';
import { PascalCase } from 'type-fest';
export declare function loadProjectFromFile(path: string): Promise<Project>;
export declare function loadProjectFromString(content: string): Project;
export type LooseDataValue = DataValue | string | number | boolean;
export type RunGraphOptions = {
    graph: string;
    inputs?: Record<string, LooseDataValue>;
    context?: Record<string, LooseDataValue>;
    remoteDebugger?: NodaiDebuggerServer;
    nativeApi?: NativeApi;
    externalFunctions?: {
        [key: string]: ExternalFunction;
    };
    onUserEvent?: {
        [key: string]: (data: DataValue | undefined) => void;
    };
    abortSignal?: AbortSignal;
} & {
    [P in keyof ProcessEvents as `on${PascalCase<P>}`]?: (params: ProcessEvents[P]) => void;
} & Settings;
export declare function runGraphInFile(path: string, options: RunGraphOptions): Promise<Record<string, DataValue>>;
export declare function createProcessor(project: Project, options: RunGraphOptions): {
    processor: GraphProcessor;
    inputs: Record<string, DataValue>;
    contextValues: Record<string, DataValue>;
    run(): Promise<import("./core").GraphOutputs>;
};
export declare function runGraph(project: Project, options: RunGraphOptions): Promise<Record<string, DataValue>>;
