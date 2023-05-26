import { Opaque } from 'type-fest';
import { DataValue } from './DataValue';
import { ExternalFunction, GraphProcessor, Inputs, Outputs } from './GraphProcessor';
import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from './NodeBase';
import { GraphId } from './NodeGraph';
import { Project } from './Project';
import { NativeApi } from './native/NativeApi';

export interface Settings {
  openAiKey: string;
  openAiOrganization?: string;
}

export abstract class NodeImpl<T extends ChartNode, Type extends T['type'] = T['type']> {
  readonly chartNode: T;

  constructor(chartNode: T) {
    this.chartNode = chartNode;
  }

  get id(): string {
    return this.chartNode.id;
  }

  get type(): Type {
    return this.chartNode.type as Type;
  }

  get title(): string {
    return this.chartNode.title;
  }

  get visualData(): { x: number; y: number } {
    return this.chartNode.visualData;
  }

  get data(): T['data'] {
    return this.chartNode.data;
  }

  abstract getInputDefinitions(
    connections: NodeConnection[],
    nodes: Record<NodeId, ChartNode>,
    project: Project,
  ): NodeInputDefinition[];

  abstract getOutputDefinitions(
    connections: NodeConnection[],
    nodes: Record<NodeId, ChartNode>,
    project: Project,
  ): NodeOutputDefinition[];

  abstract process(inputData: Inputs, context: InternalProcessContext): Promise<Outputs>;
}

export type ProcessContext = {
  settings: Settings;
  nativeApi: NativeApi;
};

export type ProcessId = Opaque<string, 'ProcessId'>;

export type InternalProcessContext = ProcessContext & {
  /** The project being executed. */
  project: Project;

  /** A signal that can be used when abort() is called on the GraphProcessor to abort the node's execution. */
  signal: AbortSignal;

  /** A unique ID for this specific execution of the node. */
  processId: ProcessId;

  /** Context values that are accessible on graphs and all subgraphs. */
  contextValues: Record<string, DataValue>;

  /** Raises a user event that can be listened for on the GraphProcessor. */
  raiseEvent: (eventName: string, data: DataValue | undefined) => void;

  /** External functions that have been defined on the GraphProcessor (or its parent). */
  externalFunctions: Record<string, ExternalFunction>;

  /** Global cache shared by all nodes, is present for the entire execution of a graph (and shared in subgraphs). */
  executionCache: Map<string, unknown>;

  /** Call when the node has partial data but has not finished execution yet. */
  onPartialOutputs?: (outputs: Outputs) => void;

  /** Creates a subprocessor, for executing subgraphs. */
  createSubProcessor: (subGraphId: GraphId) => GraphProcessor;
};
