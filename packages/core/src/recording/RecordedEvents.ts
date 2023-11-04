import type { Opaque, OverrideProperties } from 'type-fest';
import {
  type ProcessEvents,
  type ProjectId,
  type GraphInputs,
  type DataValue,
  type GraphId,
  type GraphOutputs,
  type NodeId,
  type Inputs,
  type ProcessId,
  type Outputs,
  type StringArrayDataValue,
} from '../index.js';

export type RecordingId = Opaque<string, 'RecordingId'>;

export type RecordedEventsMap = OverrideProperties<
  ProcessEvents,
  {
    start: { projectId: ProjectId; inputs: GraphInputs; contextValues: Record<string, DataValue>; startGraph: GraphId };

    /** Called when a graph or subgraph has started. */
    graphStart: { graphId: GraphId; inputs: GraphInputs };

    /** Called when a graph or subgraph has errored. */
    graphError: { graphId: GraphId; error: Error | string };

    /** Called when a graph or a subgraph has finished. */
    graphFinish: { graphId: GraphId; outputs: GraphOutputs };

    /** Called when a graph or subgraph has been aborted. */
    graphAbort: { graphId: GraphId; error?: string; successful: boolean };

    /** Called when a node has started processing, with the input values for the node. */
    nodeStart: { nodeId: NodeId; inputs: Inputs; processId: ProcessId };

    /** Called when a node has finished processing, with the output values for the node. */
    nodeFinish: { nodeId: NodeId; outputs: Outputs; processId: ProcessId };

    /** Called when a node has errored during processing. */
    nodeError: { nodeId: NodeId; error: string; processId: ProcessId };

    /** Called when a node has been excluded from processing. */
    nodeExcluded: { nodeId: NodeId; processId: ProcessId; inputs: Inputs; outputs: Outputs; reason: string };

    /** Called when a user input node requires user input. Call the callback when finished, or call userInput() on the GraphProcessor with the results. */
    userInput: {
      nodeId: NodeId;
      inputs: Inputs;
      callback: (values: StringArrayDataValue) => void;
      processId: ProcessId;
    };

    /** Called when a node has partially processed, with the current partial output values for the node. */
    partialOutput: { nodeId: NodeId; outputs: Outputs; index: number; processId: ProcessId };

    /** Called when the outputs of a node have been cleared entirely. If processId is present, only the one process() should be cleared. */
    nodeOutputsCleared: { nodeId: NodeId; processId?: ProcessId };

    /** Called when the root graph has errored. The root graph will also throw. */
    error: { error: string };

    newAbortController: undefined;
  }
>;

export type RecordedEvent<T extends keyof ProcessEvents> = {
  type: T;
  data: RecordedEventsMap[T];
  ts: number;
};

export type RecordedEvents = Pick<
  {
    [K in keyof RecordedEventsMap]: RecordedEvent<K>;
  },
  keyof RecordedEventsMap
>[keyof RecordedEventsMap];

export type Recording = {
  recordingId: RecordingId;

  startTs: number;
  finishTs: number;

  events: RecordedEvents[];
};

export type SerializedRecording = {
  version: number;
  recording: Recording;
};
