import { DataValue, ArrayDataValue, AnyDataValue, StringArrayDataValue, ControlFlowExcludedDataValue, ScalarOrArrayDataValue } from './DataValue';
import { ChartNode, NodeId, PortId } from './NodeBase';
import { GraphId, NodeGraph } from './NodeGraph';
import { UserInputNode } from './nodes/UserInputNode';
import { Project } from './Project';
import { ProcessContext, ProcessId } from './ProcessContext';
import { ExecutionRecorder } from '../recording/ExecutionRecorder';
export type ProcessEvents = {
    /** Called when processing has started. */
    start: {
        project: Project;
        inputs: GraphInputs;
        contextValues: Record<string, DataValue>;
    };
    /** Called when a graph or subgraph has started. */
    graphStart: {
        graph: NodeGraph;
        inputs: GraphInputs;
    };
    /** Called when a graph or subgraph has errored. */
    graphError: {
        graph: NodeGraph;
        error: Error | string;
    };
    /** Called when a graph or a subgraph has finished. */
    graphFinish: {
        graph: NodeGraph;
        outputs: GraphOutputs;
    };
    /** Called when a node has started processing, with the input values for the node. */
    nodeStart: {
        node: ChartNode;
        inputs: Inputs;
        processId: ProcessId;
    };
    /** Called when a node has finished processing, with the output values for the node. */
    nodeFinish: {
        node: ChartNode;
        outputs: Outputs;
        processId: ProcessId;
    };
    /** Called when a node has errored during processing. */
    nodeError: {
        node: ChartNode;
        error: Error | string;
        processId: ProcessId;
    };
    /** Called when a node has been excluded from processing. */
    nodeExcluded: {
        node: ChartNode;
        processId: ProcessId;
    };
    /** Called when a user input node requires user input. Call the callback when finished, or call userInput() on the GraphProcessor with the results. */
    userInput: {
        node: UserInputNode;
        inputs: Inputs;
        callback: (values: StringArrayDataValue) => void;
        processId: ProcessId;
    };
    /** Called when a node has partially processed, with the current partial output values for the node. */
    partialOutput: {
        node: ChartNode;
        outputs: Outputs;
        index: number;
        processId: ProcessId;
    };
    /** Called when the outputs of a node have been cleared entirely. If processId is present, only the one process() should be cleared. */
    nodeOutputsCleared: {
        node: ChartNode;
        processId?: ProcessId;
    };
    /** Called when the root graph has errored. The root graph will also throw. */
    error: {
        error: Error | string;
    };
    /** Called when processing has completed. */
    done: {
        results: GraphOutputs;
    };
    /** Called when processing has been aborted. */
    abort: {
        successful: boolean;
        error?: string | Error;
    };
    /** Called for trace level logs. */
    trace: string;
    /** Called when the graph has been paused. */
    pause: void;
    /** Called when the graph has been resumed. */
    resume: void;
    /** Called when a global variable has been set in a graph. */
    globalSet: {
        id: string;
        value: ScalarOrArrayDataValue;
        processId: ProcessId;
    };
} & {
    /** Listen for any user event. */
    [key: `userEvent:${string}`]: DataValue | undefined;
} & {
    [key: `globalSet:${string}`]: ScalarOrArrayDataValue | undefined;
};
export type GraphOutputs = Record<string, DataValue>;
export type GraphInputs = Record<string, DataValue>;
export type NodeResults = Map<NodeId, Outputs>;
export type Inputs = Record<PortId, DataValue | undefined>;
export type Outputs = Record<PortId, DataValue | undefined>;
export type ExternalFunction = (...args: unknown[]) => Promise<DataValue>;
export declare class GraphProcessor {
    #private;
    slowMode: boolean;
    id: string;
    /** The interval between nodeFinish events when playing back a recording. I.e. how fast the playback is. */
    recordingPlaybackChatLatency: number;
    get isRunning(): boolean;
    constructor(project: Project, graphId: GraphId);
    on: <Name extends "userInput" | "done" | "error" | `userEvent:${string}` | `globalSet:${string}` | "start" | "graphStart" | "graphError" | "graphFinish" | "nodeStart" | "nodeFinish" | "nodeError" | "nodeExcluded" | "partialOutput" | "nodeOutputsCleared" | "abort" | "trace" | "pause" | "resume" | "globalSet" | keyof import("emittery").OmnipresentEventData>(eventName: Name | readonly Name[], listener: (eventData: ({
        /** Called when processing has started. */
        start: {
            project: Project;
            inputs: GraphInputs;
            contextValues: Record<string, DataValue>;
        };
        /** Called when a graph or subgraph has started. */
        graphStart: {
            graph: NodeGraph;
            inputs: GraphInputs;
        };
        /** Called when a graph or subgraph has errored. */
        graphError: {
            graph: NodeGraph;
            error: string | Error;
        };
        /** Called when a graph or a subgraph has finished. */
        graphFinish: {
            graph: NodeGraph;
            outputs: GraphOutputs;
        };
        /** Called when a node has started processing, with the input values for the node. */
        nodeStart: {
            node: ChartNode;
            inputs: Inputs;
            processId: ProcessId;
        };
        /** Called when a node has finished processing, with the output values for the node. */
        nodeFinish: {
            node: ChartNode;
            outputs: Outputs;
            processId: ProcessId;
        };
        /** Called when a node has errored during processing. */
        nodeError: {
            node: ChartNode;
            error: string | Error;
            processId: ProcessId;
        };
        /** Called when a node has been excluded from processing. */
        nodeExcluded: {
            node: ChartNode;
            processId: ProcessId;
        };
        /** Called when a user input node requires user input. Call the callback when finished, or call userInput() on the GraphProcessor with the results. */
        userInput: {
            node: UserInputNode;
            inputs: Inputs;
            callback: (values: StringArrayDataValue) => void;
            processId: ProcessId;
        };
        /** Called when a node has partially processed, with the current partial output values for the node. */
        partialOutput: {
            node: ChartNode;
            outputs: Outputs;
            index: number;
            processId: ProcessId;
        };
        /** Called when the outputs of a node have been cleared entirely. If processId is present, only the one process() should be cleared. */
        nodeOutputsCleared: {
            node: ChartNode;
            processId?: ProcessId | undefined;
        };
        /** Called when the root graph has errored. The root graph will also throw. */
        error: {
            error: string | Error;
        };
        /** Called when processing has completed. */
        done: {
            results: GraphOutputs;
        };
        /** Called when processing has been aborted. */
        abort: {
            successful: boolean;
            error?: string | Error | undefined;
        };
        /** Called for trace level logs. */
        trace: string;
        /** Called when the graph has been paused. */
        pause: void;
        /** Called when the graph has been resumed. */
        resume: void;
        /** Called when a global variable has been set in a graph. */
        globalSet: {
            id: string;
            value: ScalarOrArrayDataValue;
            processId: ProcessId;
        };
    } & {
        [key: `userEvent:${string}`]: DataValue | undefined;
    } & {
        [key: `globalSet:${string}`]: ScalarOrArrayDataValue | undefined;
    } & import("emittery").OmnipresentEventData)[Name]) => void | Promise<void>) => import("emittery").UnsubscribeFunction;
    off: <Name extends "userInput" | "done" | "error" | `userEvent:${string}` | `globalSet:${string}` | "start" | "graphStart" | "graphError" | "graphFinish" | "nodeStart" | "nodeFinish" | "nodeError" | "nodeExcluded" | "partialOutput" | "nodeOutputsCleared" | "abort" | "trace" | "pause" | "resume" | "globalSet" | keyof import("emittery").OmnipresentEventData>(eventName: Name | readonly Name[], listener: (eventData: ({
        /** Called when processing has started. */
        start: {
            project: Project;
            inputs: GraphInputs;
            contextValues: Record<string, DataValue>;
        };
        /** Called when a graph or subgraph has started. */
        graphStart: {
            graph: NodeGraph;
            inputs: GraphInputs;
        };
        /** Called when a graph or subgraph has errored. */
        graphError: {
            graph: NodeGraph;
            error: string | Error;
        };
        /** Called when a graph or a subgraph has finished. */
        graphFinish: {
            graph: NodeGraph;
            outputs: GraphOutputs;
        };
        /** Called when a node has started processing, with the input values for the node. */
        nodeStart: {
            node: ChartNode;
            inputs: Inputs;
            processId: ProcessId;
        };
        /** Called when a node has finished processing, with the output values for the node. */
        nodeFinish: {
            node: ChartNode;
            outputs: Outputs;
            processId: ProcessId;
        };
        /** Called when a node has errored during processing. */
        nodeError: {
            node: ChartNode;
            error: string | Error;
            processId: ProcessId;
        };
        /** Called when a node has been excluded from processing. */
        nodeExcluded: {
            node: ChartNode;
            processId: ProcessId;
        };
        /** Called when a user input node requires user input. Call the callback when finished, or call userInput() on the GraphProcessor with the results. */
        userInput: {
            node: UserInputNode;
            inputs: Inputs;
            callback: (values: StringArrayDataValue) => void;
            processId: ProcessId;
        };
        /** Called when a node has partially processed, with the current partial output values for the node. */
        partialOutput: {
            node: ChartNode;
            outputs: Outputs;
            index: number;
            processId: ProcessId;
        };
        /** Called when the outputs of a node have been cleared entirely. If processId is present, only the one process() should be cleared. */
        nodeOutputsCleared: {
            node: ChartNode;
            processId?: ProcessId | undefined;
        };
        /** Called when the root graph has errored. The root graph will also throw. */
        error: {
            error: string | Error;
        };
        /** Called when processing has completed. */
        done: {
            results: GraphOutputs;
        };
        /** Called when processing has been aborted. */
        abort: {
            successful: boolean;
            error?: string | Error | undefined;
        };
        /** Called for trace level logs. */
        trace: string;
        /** Called when the graph has been paused. */
        pause: void;
        /** Called when the graph has been resumed. */
        resume: void;
        /** Called when a global variable has been set in a graph. */
        globalSet: {
            id: string;
            value: ScalarOrArrayDataValue;
            processId: ProcessId;
        };
    } & {
        [key: `userEvent:${string}`]: DataValue | undefined;
    } & {
        [key: `globalSet:${string}`]: ScalarOrArrayDataValue | undefined;
    } & import("emittery").OmnipresentEventData)[Name]) => void | Promise<void>) => void;
    once: <Name extends "userInput" | "done" | "error" | `userEvent:${string}` | `globalSet:${string}` | "start" | "graphStart" | "graphError" | "graphFinish" | "nodeStart" | "nodeFinish" | "nodeError" | "nodeExcluded" | "partialOutput" | "nodeOutputsCleared" | "abort" | "trace" | "pause" | "resume" | "globalSet" | keyof import("emittery").OmnipresentEventData>(eventName: Name | readonly Name[]) => import("emittery").EmitteryOncePromise<({
        /** Called when processing has started. */
        start: {
            project: Project;
            inputs: GraphInputs;
            contextValues: Record<string, DataValue>;
        };
        /** Called when a graph or subgraph has started. */
        graphStart: {
            graph: NodeGraph;
            inputs: GraphInputs;
        };
        /** Called when a graph or subgraph has errored. */
        graphError: {
            graph: NodeGraph;
            error: string | Error;
        };
        /** Called when a graph or a subgraph has finished. */
        graphFinish: {
            graph: NodeGraph;
            outputs: GraphOutputs;
        };
        /** Called when a node has started processing, with the input values for the node. */
        nodeStart: {
            node: ChartNode;
            inputs: Inputs;
            processId: ProcessId;
        };
        /** Called when a node has finished processing, with the output values for the node. */
        nodeFinish: {
            node: ChartNode;
            outputs: Outputs;
            processId: ProcessId;
        };
        /** Called when a node has errored during processing. */
        nodeError: {
            node: ChartNode;
            error: string | Error;
            processId: ProcessId;
        };
        /** Called when a node has been excluded from processing. */
        nodeExcluded: {
            node: ChartNode;
            processId: ProcessId;
        };
        /** Called when a user input node requires user input. Call the callback when finished, or call userInput() on the GraphProcessor with the results. */
        userInput: {
            node: UserInputNode;
            inputs: Inputs;
            callback: (values: StringArrayDataValue) => void;
            processId: ProcessId;
        };
        /** Called when a node has partially processed, with the current partial output values for the node. */
        partialOutput: {
            node: ChartNode;
            outputs: Outputs;
            index: number;
            processId: ProcessId;
        };
        /** Called when the outputs of a node have been cleared entirely. If processId is present, only the one process() should be cleared. */
        nodeOutputsCleared: {
            node: ChartNode;
            processId?: ProcessId | undefined;
        };
        /** Called when the root graph has errored. The root graph will also throw. */
        error: {
            error: string | Error;
        };
        /** Called when processing has completed. */
        done: {
            results: GraphOutputs;
        };
        /** Called when processing has been aborted. */
        abort: {
            successful: boolean;
            error?: string | Error | undefined;
        };
        /** Called for trace level logs. */
        trace: string;
        /** Called when the graph has been paused. */
        pause: void;
        /** Called when the graph has been resumed. */
        resume: void;
        /** Called when a global variable has been set in a graph. */
        globalSet: {
            id: string;
            value: ScalarOrArrayDataValue;
            processId: ProcessId;
        };
    } & {
        [key: `userEvent:${string}`]: DataValue | undefined;
    } & {
        [key: `globalSet:${string}`]: ScalarOrArrayDataValue | undefined;
    } & import("emittery").OmnipresentEventData)[Name]>;
    onAny: (listener: (eventName: "userInput" | "done" | "error" | `userEvent:${string}` | `globalSet:${string}` | "start" | "graphStart" | "graphError" | "graphFinish" | "nodeStart" | "nodeFinish" | "nodeError" | "nodeExcluded" | "partialOutput" | "nodeOutputsCleared" | "abort" | "trace" | "pause" | "resume" | "globalSet", eventData: string | void | import("./DataValue").StringDataValue | import("./DataValue").NumberDataValue | import("./DataValue").BoolDataValue | import("./DataValue").ChatMessageDataValue | import("./DataValue").DateDataValue | import("./DataValue").TimeDataValue | import("./DataValue").DateTimeDataValue | AnyDataValue | import("./DataValue").ObjectDataValue | import("./DataValue").VectorDataValue | import("./DataValue").GptFunctionDataValue | ControlFlowExcludedDataValue | ArrayDataValue<import("./DataValue").StringDataValue> | ArrayDataValue<import("./DataValue").NumberDataValue> | ArrayDataValue<import("./DataValue").BoolDataValue> | ArrayDataValue<import("./DataValue").ObjectDataValue> | ArrayDataValue<import("./DataValue").ChatMessageDataValue> | ArrayDataValue<import("./DataValue").DateDataValue> | ArrayDataValue<import("./DataValue").TimeDataValue> | ArrayDataValue<import("./DataValue").DateTimeDataValue> | ArrayDataValue<AnyDataValue> | ArrayDataValue<import("./DataValue").VectorDataValue> | ArrayDataValue<import("./DataValue").GptFunctionDataValue> | ArrayDataValue<ControlFlowExcludedDataValue> | import("./DataValue").FunctionDataValue<import("./DataValue").StringDataValue> | import("./DataValue").FunctionDataValue<import("./DataValue").NumberDataValue> | import("./DataValue").FunctionDataValue<import("./DataValue").BoolDataValue> | import("./DataValue").FunctionDataValue<import("./DataValue").ObjectDataValue> | import("./DataValue").FunctionDataValue<import("./DataValue").ChatMessageDataValue> | import("./DataValue").FunctionDataValue<import("./DataValue").DateDataValue> | import("./DataValue").FunctionDataValue<import("./DataValue").TimeDataValue> | import("./DataValue").FunctionDataValue<import("./DataValue").DateTimeDataValue> | import("./DataValue").FunctionDataValue<AnyDataValue> | import("./DataValue").FunctionDataValue<import("./DataValue").VectorDataValue> | import("./DataValue").FunctionDataValue<import("./DataValue").GptFunctionDataValue> | import("./DataValue").FunctionDataValue<ControlFlowExcludedDataValue> | import("./DataValue").FunctionDataValue<ArrayDataValue<import("./DataValue").StringDataValue>> | import("./DataValue").FunctionDataValue<ArrayDataValue<import("./DataValue").NumberDataValue>> | import("./DataValue").FunctionDataValue<ArrayDataValue<import("./DataValue").BoolDataValue>> | import("./DataValue").FunctionDataValue<ArrayDataValue<import("./DataValue").ObjectDataValue>> | import("./DataValue").FunctionDataValue<ArrayDataValue<import("./DataValue").ChatMessageDataValue>> | import("./DataValue").FunctionDataValue<ArrayDataValue<import("./DataValue").DateDataValue>> | import("./DataValue").FunctionDataValue<ArrayDataValue<import("./DataValue").TimeDataValue>> | import("./DataValue").FunctionDataValue<ArrayDataValue<import("./DataValue").DateTimeDataValue>> | import("./DataValue").FunctionDataValue<ArrayDataValue<AnyDataValue>> | import("./DataValue").FunctionDataValue<ArrayDataValue<import("./DataValue").VectorDataValue>> | import("./DataValue").FunctionDataValue<ArrayDataValue<import("./DataValue").GptFunctionDataValue>> | import("./DataValue").FunctionDataValue<ArrayDataValue<ControlFlowExcludedDataValue>> | {
        results: GraphOutputs;
    } | {
        successful: boolean;
        error?: string | Error | undefined;
    } | {
        id: string;
        value: ScalarOrArrayDataValue;
        processId: ProcessId;
    } | {
        graph: NodeGraph;
        inputs: GraphInputs;
    } | {
        graph: NodeGraph;
        outputs: GraphOutputs;
    } | {
        graph: NodeGraph;
        error: string | Error;
    } | {
        node: ChartNode;
        inputs: Inputs;
        processId: ProcessId;
    } | {
        node: ChartNode;
        outputs: Outputs;
        processId: ProcessId;
    } | {
        node: ChartNode;
        error: string | Error;
        processId: ProcessId;
    } | {
        node: ChartNode;
        processId: ProcessId;
    } | {
        node: UserInputNode;
        inputs: Inputs;
        callback: (values: StringArrayDataValue) => void;
        processId: ProcessId;
    } | {
        node: ChartNode;
        outputs: Outputs;
        index: number;
        processId: ProcessId;
    } | {
        node: ChartNode;
        processId?: ProcessId | undefined;
    } | {
        error: string | Error;
    } | {
        project: Project;
        inputs: GraphInputs;
        contextValues: Record<string, DataValue>;
    } | undefined) => void | Promise<void>) => import("emittery").UnsubscribeFunction;
    offAny: (listener: (eventName: "userInput" | "done" | "error" | `userEvent:${string}` | `globalSet:${string}` | "start" | "graphStart" | "graphError" | "graphFinish" | "nodeStart" | "nodeFinish" | "nodeError" | "nodeExcluded" | "partialOutput" | "nodeOutputsCleared" | "abort" | "trace" | "pause" | "resume" | "globalSet", eventData: string | void | import("./DataValue").StringDataValue | import("./DataValue").NumberDataValue | import("./DataValue").BoolDataValue | import("./DataValue").ChatMessageDataValue | import("./DataValue").DateDataValue | import("./DataValue").TimeDataValue | import("./DataValue").DateTimeDataValue | AnyDataValue | import("./DataValue").ObjectDataValue | import("./DataValue").VectorDataValue | import("./DataValue").GptFunctionDataValue | ControlFlowExcludedDataValue | ArrayDataValue<import("./DataValue").StringDataValue> | ArrayDataValue<import("./DataValue").NumberDataValue> | ArrayDataValue<import("./DataValue").BoolDataValue> | ArrayDataValue<import("./DataValue").ObjectDataValue> | ArrayDataValue<import("./DataValue").ChatMessageDataValue> | ArrayDataValue<import("./DataValue").DateDataValue> | ArrayDataValue<import("./DataValue").TimeDataValue> | ArrayDataValue<import("./DataValue").DateTimeDataValue> | ArrayDataValue<AnyDataValue> | ArrayDataValue<import("./DataValue").VectorDataValue> | ArrayDataValue<import("./DataValue").GptFunctionDataValue> | ArrayDataValue<ControlFlowExcludedDataValue> | import("./DataValue").FunctionDataValue<import("./DataValue").StringDataValue> | import("./DataValue").FunctionDataValue<import("./DataValue").NumberDataValue> | import("./DataValue").FunctionDataValue<import("./DataValue").BoolDataValue> | import("./DataValue").FunctionDataValue<import("./DataValue").ObjectDataValue> | import("./DataValue").FunctionDataValue<import("./DataValue").ChatMessageDataValue> | import("./DataValue").FunctionDataValue<import("./DataValue").DateDataValue> | import("./DataValue").FunctionDataValue<import("./DataValue").TimeDataValue> | import("./DataValue").FunctionDataValue<import("./DataValue").DateTimeDataValue> | import("./DataValue").FunctionDataValue<AnyDataValue> | import("./DataValue").FunctionDataValue<import("./DataValue").VectorDataValue> | import("./DataValue").FunctionDataValue<import("./DataValue").GptFunctionDataValue> | import("./DataValue").FunctionDataValue<ControlFlowExcludedDataValue> | import("./DataValue").FunctionDataValue<ArrayDataValue<import("./DataValue").StringDataValue>> | import("./DataValue").FunctionDataValue<ArrayDataValue<import("./DataValue").NumberDataValue>> | import("./DataValue").FunctionDataValue<ArrayDataValue<import("./DataValue").BoolDataValue>> | import("./DataValue").FunctionDataValue<ArrayDataValue<import("./DataValue").ObjectDataValue>> | import("./DataValue").FunctionDataValue<ArrayDataValue<import("./DataValue").ChatMessageDataValue>> | import("./DataValue").FunctionDataValue<ArrayDataValue<import("./DataValue").DateDataValue>> | import("./DataValue").FunctionDataValue<ArrayDataValue<import("./DataValue").TimeDataValue>> | import("./DataValue").FunctionDataValue<ArrayDataValue<import("./DataValue").DateTimeDataValue>> | import("./DataValue").FunctionDataValue<ArrayDataValue<AnyDataValue>> | import("./DataValue").FunctionDataValue<ArrayDataValue<import("./DataValue").VectorDataValue>> | import("./DataValue").FunctionDataValue<ArrayDataValue<import("./DataValue").GptFunctionDataValue>> | import("./DataValue").FunctionDataValue<ArrayDataValue<ControlFlowExcludedDataValue>> | {
        results: GraphOutputs;
    } | {
        successful: boolean;
        error?: string | Error | undefined;
    } | {
        id: string;
        value: ScalarOrArrayDataValue;
        processId: ProcessId;
    } | {
        graph: NodeGraph;
        inputs: GraphInputs;
    } | {
        graph: NodeGraph;
        outputs: GraphOutputs;
    } | {
        graph: NodeGraph;
        error: string | Error;
    } | {
        node: ChartNode;
        inputs: Inputs;
        processId: ProcessId;
    } | {
        node: ChartNode;
        outputs: Outputs;
        processId: ProcessId;
    } | {
        node: ChartNode;
        error: string | Error;
        processId: ProcessId;
    } | {
        node: ChartNode;
        processId: ProcessId;
    } | {
        node: UserInputNode;
        inputs: Inputs;
        callback: (values: StringArrayDataValue) => void;
        processId: ProcessId;
    } | {
        node: ChartNode;
        outputs: Outputs;
        index: number;
        processId: ProcessId;
    } | {
        node: ChartNode;
        processId?: ProcessId | undefined;
    } | {
        error: string | Error;
    } | {
        project: Project;
        inputs: GraphInputs;
        contextValues: Record<string, DataValue>;
    } | undefined) => void | Promise<void>) => void;
    onUserEvent(onEvent: string, listener: (event: DataValue | undefined) => void): void;
    offUserEvent(listener: (data: DataValue | undefined) => void): void;
    userInput(nodeId: NodeId, values: StringArrayDataValue): void;
    setExternalFunction(name: string, fn: ExternalFunction): void;
    abort(successful?: boolean, error?: Error | string): Promise<void>;
    pause(): void;
    resume(): void;
    setSlowMode(slowMode: boolean): void;
    replayRecording(recorder: ExecutionRecorder): Promise<GraphOutputs>;
    /** Main function for running a graph. Runs a graph and returns the outputs from the output nodes of the graph. */
    processGraph(
    /** Required and optional context available to the nodes and all subgraphs. */
    context: ProcessContext, 
    /** Inputs to the main graph. You should pass all inputs required by the GraphInputNodes of the graph. */
    inputs?: Record<string, DataValue>, 
    /** Contextual data available to all graphs and subgraphs. Kind of like react context, avoids drilling down data into subgraphs. Be careful when using it. */
    contextValues?: Record<string, DataValue>): Promise<GraphOutputs>;
    getRootProcessor(): GraphProcessor;
    /** Raise a user event on the processor, all subprocessors, and their children. */
    raiseEvent(event: string, data: DataValue): void;
}
