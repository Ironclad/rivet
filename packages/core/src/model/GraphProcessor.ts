import { max, range, sum, uniqBy } from 'lodash-es';
import { ControlFlowExcluded, ControlFlowExcludedPort } from '../utils/symbols.js';
import {
  DataValue,
  ArrayDataValue,
  AnyDataValue,
  StringArrayDataValue,
  ControlFlowExcludedDataValue,
  isArrayDataValue,
  arrayizeDataValue,
  ScalarOrArrayDataValue,
  getScalarTypeOf,
} from './DataValue.js';
import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from './NodeBase.js';
import { GraphId, NodeGraph } from './NodeGraph.js';
import { NodeImpl } from './NodeImpl.js';
import { UserInputNode, UserInputNodeImpl } from './nodes/UserInputNode.js';
import PQueueImport from 'p-queue';
import { getError } from '../utils/errors.js';
import Emittery from 'emittery';
import { entries, fromEntries, values } from '../utils/typeSafety.js';
import { isNotNull } from '../utils/genericUtilFunctions.js';
import { Project } from './Project.js';
import { nanoid } from 'nanoid';
import { InternalProcessContext, ProcessContext, ProcessId } from './ProcessContext.js';
import { ExecutionRecorder } from '../recording/ExecutionRecorder.js';
import { P, match } from 'ts-pattern';
import { Opaque } from 'type-fest';
import { coerceTypeOptional } from '../utils/coerceType.js';
import { BuiltInNodeType, BuiltInNodes, globalRivetNodeRegistry } from './Nodes.js';
import { NodeRegistration } from './NodeRegistration.js';
import { StringPluginConfigurationSpec } from './RivetPlugin.js';

// CJS compatibility, gets default.default for whatever reason
let PQueue = PQueueImport;
if (typeof PQueue !== 'function') {
  PQueue = (PQueueImport as any).default;
}

export type ProcessEvents = {
  /** Called when processing has started. */
  start: { project: Project; inputs: GraphInputs; contextValues: Record<string, DataValue> };

  /** Called when a graph or subgraph has started. */
  graphStart: { graph: NodeGraph; inputs: GraphInputs };

  /** Called when a graph or subgraph has errored. */
  graphError: { graph: NodeGraph; error: Error | string };

  /** Called when a graph or a subgraph has finished. */
  graphFinish: { graph: NodeGraph; outputs: GraphOutputs };

  /** Called when a graph has been aborted. */
  graphAbort: { successful: boolean; graph: NodeGraph; error?: Error | string };

  /** Called when a node has started processing, with the input values for the node. */
  nodeStart: { node: ChartNode; inputs: Inputs; processId: ProcessId };

  /** Called when a node has finished processing, with the output values for the node. */
  nodeFinish: { node: ChartNode; outputs: Outputs; processId: ProcessId };

  /** Called when a node has errored during processing. */
  nodeError: { node: ChartNode; error: Error | string; processId: ProcessId };

  /** Called when a node has been excluded from processing. */
  nodeExcluded: { node: ChartNode; processId: ProcessId };

  /** Called when a user input node requires user input. Call the callback when finished, or call userInput() on the GraphProcessor with the results. */
  userInput: {
    node: UserInputNode;
    inputs: Inputs;
    callback: (values: StringArrayDataValue) => void;
    processId: ProcessId;
  };

  /** Called when a node has partially processed, with the current partial output values for the node. */
  partialOutput: { node: ChartNode; outputs: Outputs; index: number; processId: ProcessId };

  /** Called when the outputs of a node have been cleared entirely. If processId is present, only the one process() should be cleared. */
  nodeOutputsCleared: { node: ChartNode; processId?: ProcessId };

  /** Called when the root graph has errored. The root graph will also throw. */
  error: { error: Error | string };

  /** Called when processing has completed. */
  done: { results: GraphOutputs };

  /** Called when processing has been aborted. */
  abort: { successful: boolean; error?: string | Error };

  /** Called for trace level logs. */
  trace: string;

  /** Called when the graph has been paused. */
  pause: void;

  /** Called when the graph has been resumed. */
  resume: void;

  /** Called when a global variable has been set in a graph. */
  globalSet: { id: string; value: ScalarOrArrayDataValue; processId: ProcessId };
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

export type ExternalFunctionProcessContext = Omit<InternalProcessContext, 'setGlobal'>;

export type ExternalFunction = (
  context: ExternalFunctionProcessContext,
  ...args: unknown[]
) => Promise<DataValue & { cost?: number }>;

type RaceId = Opaque<string, 'RaceId'>;

type LoopInfo = AttachedNodeDataItem & {
  /** ID of the controller of the loop */
  loopControllerId: NodeId;

  /** Nodes add themselves to this as the loop processes */
  nodes: Set<NodeId>;

  iterationCount: number;
};

type AttachedNodeDataItem = {
  propagate: boolean | ((parent: ChartNode, connections: NodeConnection[]) => boolean);
};

type AttachedNodeData = {
  loopInfo?: LoopInfo;
  races?: {
    propagate: boolean;
    raceIds: RaceId[];

    // The race is completed by some branch
    completed: boolean;
  };

  [key: string]: AttachedNodeDataItem | undefined;
};

export class GraphProcessor {
  // Per-instance state
  #graph: NodeGraph;
  #project: Project;
  #nodesById: Record<NodeId, ChartNode>;
  #nodeInstances: Record<NodeId, NodeImpl<ChartNode>>;
  #connections: Record<NodeId, NodeConnection[]>;
  #definitions: Record<NodeId, { inputs: NodeInputDefinition[]; outputs: NodeOutputDefinition[] }>;
  #emitter: Emittery<ProcessEvents> = new Emittery();
  #running = false;
  #isSubProcessor = false;
  #scc: ChartNode[][];
  #nodesNotInCycle: ChartNode[];
  #externalFunctions: Record<string, ExternalFunction> = {};
  slowMode = false;
  #isPaused = false;
  #parent: GraphProcessor | undefined;
  #registry: NodeRegistration;
  id = nanoid();

  /** If set, specifies the node(s) that the graph will run TO, instead of the nodes without any dependents. */
  runToNodeIds?: NodeId[];

  /** The node that is executing this graph, almost always a subgraph node. Undefined for root. */
  #executor:
    | {
        nodeId: NodeId;
        index: number;
        processId: ProcessId;
      }
    | undefined;

  /** The interval between nodeFinish events when playing back a recording. I.e. how fast the playback is. */
  recordingPlaybackChatLatency = 1000;

  warnOnInvalidGraph = false;

  // Per-process state
  #erroredNodes: Map<NodeId, string> = undefined!;
  #remainingNodes: Set<NodeId> = undefined!;
  #visitedNodes: Set<NodeId> = undefined!;
  #currentlyProcessing: Set<NodeId> = undefined!;
  #context: ProcessContext = undefined!;
  #nodeResults: NodeResults = undefined!;
  #abortController: AbortController = undefined!;
  #processingQueue: PQueueImport = undefined!;
  #graphInputs: GraphInputs = undefined!;
  #graphOutputs: GraphOutputs = undefined!;
  #executionCache: Map<string, unknown> = undefined!;
  #queuedNodes: Set<NodeId> = undefined!;
  #loopControllersSeen: Set<NodeId> = undefined!;
  #subprocessors: Set<GraphProcessor> = undefined!;
  #contextValues: Record<string, DataValue> = undefined!;
  #globals: Map<string, ScalarOrArrayDataValue> = undefined!;
  #attachedNodeData: Map<NodeId, AttachedNodeData> = undefined!;
  #aborted = false;
  #abortSuccessfully = false;
  #abortError: Error | string | undefined = undefined;
  #totalCost: number = 0;
  #ignoreNodes: Set<NodeId> = undefined!;

  #nodeAbortControllers = new Map<`${NodeId}-${ProcessId}`, AbortController>();

  /** User input nodes that are pending user input. */
  #pendingUserInputs: Record<
    NodeId,
    { resolve: (values: StringArrayDataValue) => void; reject: (error: unknown) => void }
  > = undefined!;

  get isRunning() {
    return this.#running;
  }

  constructor(project: Project, graphId: GraphId, registry?: NodeRegistration) {
    this.#project = project;
    const graph = project.graphs[graphId];

    if (!graph) {
      throw new Error(`Graph ${graphId} not found in project`);
    }
    this.#graph = graph;

    this.#nodeInstances = {};
    this.#connections = {};
    this.#nodesById = {};
    this.#registry = registry ?? (globalRivetNodeRegistry as unknown as NodeRegistration);

    this.#emitter.bindMethods(this as any, ['on', 'off', 'once', 'onAny', 'offAny']);

    // Create node instances and store them in a lookup table
    for (const node of this.#graph.nodes) {
      this.#nodeInstances[node.id] = this.#registry.createDynamicImpl(node);
      this.#nodesById[node.id] = node;
    }

    // Store connections in a lookup table
    for (const conn of this.#graph.connections) {
      if (!this.#nodesById[conn.inputNodeId] || !this.#nodesById[conn.outputNodeId]) {
        if (this.warnOnInvalidGraph) {
          if (!this.#nodesById[conn.inputNodeId]) {
            console.warn(
              `Missing node ${conn.inputNodeId} in graph ${graphId} (connection from ${
                this.#nodesById[conn.outputNodeId]?.title
              })`,
            );
          } else {
            console.warn(
              `Missing node ${conn.outputNodeId} in graph ${graphId} (connection to ${
                this.#nodesById[conn.inputNodeId]?.title
              }) `,
            );
          }
        }
        continue;
      }

      this.#connections[conn.inputNodeId] ??= [];
      this.#connections[conn.outputNodeId] ??= [];
      this.#connections[conn.inputNodeId]!.push(conn);
      this.#connections[conn.outputNodeId]!.push(conn);
    }

    // Store input and output definitions in a lookup table
    this.#definitions = {};
    for (const node of this.#graph.nodes) {
      const connectionsForNode = this.#connections[node.id] ?? [];
      const inputDefs = this.#nodeInstances[node.id]!.getInputDefinitions(
        connectionsForNode,
        this.#nodesById,
        this.#project,
      );

      const outputDefs = this.#nodeInstances[node.id]!.getOutputDefinitions(
        connectionsForNode,
        this.#nodesById,
        this.#project,
      );

      this.#definitions[node.id] = { inputs: inputDefs, outputs: outputDefs };

      // Find all invalid connections to or from the node, then remove them from consideration
      const invalidConnections = connectionsForNode.filter((connection) => {
        if (connection.inputNodeId === node.id) {
          const inputDef = inputDefs.find((def) => def.id === connection.inputId);

          if (!inputDef) {
            if (this.warnOnInvalidGraph) {
              const nodeFrom = this.#nodesById[connection.outputNodeId];
              console.warn(
                `[Warn] Invalid connection going from "${nodeFrom?.title}".${connection.outputId} to "${node.title}".${connection.inputId}`,
              );
            }

            return true;
          }
        } else {
          const outputDef = outputDefs.find((def) => def.id === connection.outputId);

          if (!outputDef) {
            if (this.warnOnInvalidGraph) {
              const nodeTo = this.#nodesById[connection.inputNodeId];
              console.warn(
                `[Warn] Invalid connection going from "${node.title}".${connection.outputId} to "${nodeTo?.title}".${connection.inputId}`,
              );
            }

            return true;
          }
        }

        return false;
      });

      for (const connections of values(this.#connections)) {
        for (const invalidConnection of invalidConnections) {
          const index = connections.indexOf(invalidConnection);
          if (index !== -1) {
            connections.splice(index, 1);
          }
        }
      }
    }

    this.#scc = this.#tarjanSCC();
    this.#nodesNotInCycle = this.#scc.filter((cycle) => cycle.length === 1).flat();

    this.setExternalFunction('echo', async (value) => ({ type: 'any', value } satisfies DataValue));

    this.#emitter.on('globalSet', ({ id, value }) => {
      this.#emitter.emit(`globalSet:${id}`, value);
    });
  }

  on = undefined! as Emittery<ProcessEvents>['on'];
  off = undefined! as Emittery<ProcessEvents>['off'];
  once = undefined! as Emittery<ProcessEvents>['once'];
  onAny = undefined! as Emittery<ProcessEvents>['onAny'];
  offAny = undefined! as Emittery<ProcessEvents>['offAny'];

  #onUserEventHandlers: Map<(event: DataValue | undefined) => void, Function> = new Map();

  onUserEvent(onEvent: string, listener: (event: DataValue | undefined) => void): void {
    const handler = (event: string, value: unknown) => {
      if (event === `userEvent:${onEvent}`) {
        listener(value as DataValue | undefined);
      }
    };

    this.#onUserEventHandlers.set(listener, handler);
    this.#emitter.onAny(handler);
  }

  offUserEvent(listener: (data: DataValue | undefined) => void): void {
    const internalHandler = this.#onUserEventHandlers.get(listener);
    this.#emitter.offAny(internalHandler as any);
  }

  userInput(nodeId: NodeId, values: StringArrayDataValue): void {
    const pending = this.#pendingUserInputs[nodeId];
    if (pending) {
      pending.resolve(values as StringArrayDataValue);
      delete this.#pendingUserInputs[nodeId];
    }

    for (const processor of this.#subprocessors) {
      processor.userInput(nodeId, values);
    }
  }

  setExternalFunction(name: string, fn: ExternalFunction): void {
    this.#externalFunctions[name] = fn;
  }

  async abort(successful: boolean = false, error?: Error | string): Promise<void> {
    if (!this.#running || this.#aborted) {
      return Promise.resolve();
    }

    this.#abortController.abort();
    this.#abortSuccessfully = successful;
    this.#abortError = error;

    this.#emitter.emit('graphAbort', { successful, error, graph: this.#graph });

    if (!this.#isSubProcessor) {
      this.#emitter.emit('abort', { successful, error });
    }

    await this.#processingQueue.onIdle();
  }

  pause(): void {
    if (this.#isPaused === false) {
      this.#isPaused = true;
      this.#emitter.emit('pause', void 0);
    }
  }

  resume(): void {
    if (this.#isPaused) {
      this.#isPaused = false;
      this.#emitter.emit('resume', void 0);
    }
  }

  setSlowMode(slowMode: boolean): void {
    this.slowMode = slowMode;
  }

  async #waitUntilUnpaused(): Promise<void> {
    if (!this.#isPaused) {
      return;
    }

    await this.#emitter.once('resume');
  }

  async replayRecording(recorder: ExecutionRecorder): Promise<GraphOutputs> {
    const { events } = recorder;

    this.#initProcessState();

    try {
      const nodesByIdAllGraphs: Record<NodeId, ChartNode> = {};
      for (const graph of Object.values(this.#project.graphs)) {
        for (const node of graph.nodes) {
          nodesByIdAllGraphs[node.id] = node;
        }
      }

      const getGraph = (graphId: GraphId) => {
        const graph = this.#project.graphs[graphId];
        if (!graph) {
          throw new Error(`Mismatch between project and recording: graph ${graphId} not found in project`);
        }
        return graph;
      };

      const getNode = (nodeId: NodeId) => {
        const node = nodesByIdAllGraphs[nodeId];

        if (!node) {
          throw new Error(`Mismatch between project and recording: node ${nodeId} not found in any graph in project`);
        }

        return node;
      };

      for (const event of events) {
        if (this.#aborted) {
          break;
        }

        await this.#waitUntilUnpaused();

        await match(event)
          .with({ type: 'start' }, ({ data }) => {
            this.#emitter.emit('start', {
              project: this.#project,
              contextValues: data.contextValues,
              inputs: data.inputs,
            });
            this.#contextValues = data.contextValues;
            this.#graphInputs = data.inputs;
          })
          .with({ type: 'abort' }, ({ data }) => {
            this.#emitter.emit('abort', data);
          })
          .with({ type: 'pause' }, () => {})
          .with({ type: 'resume' }, () => {})
          .with({ type: 'done' }, ({ data }) => {
            this.#emitter.emit('done', data);
            this.#graphOutputs = data.results;
            this.#running = false;
          })
          .with({ type: 'error' }, ({ data }) => {
            this.#emitter.emit('error', data);
          })
          .with({ type: 'globalSet' }, ({ data }) => {
            this.#emitter.emit('globalSet', data);
          })
          .with({ type: 'trace' }, ({ data }) => {
            this.#emitter.emit('trace', data);
          })
          .with({ type: 'graphStart' }, ({ data }) => {
            this.#emitter.emit('graphStart', {
              graph: getGraph(data.graphId),
              inputs: data.inputs,
            });
          })
          .with({ type: 'graphFinish' }, ({ data }) => {
            this.#emitter.emit('graphFinish', {
              graph: getGraph(data.graphId),
              outputs: data.outputs,
            });
          })
          .with({ type: 'graphError' }, ({ data }) => {
            this.#emitter.emit('graphError', {
              graph: getGraph(data.graphId),
              error: data.error,
            });
          })
          .with({ type: 'graphAbort' }, ({ data }) => {
            this.#emitter.emit('graphAbort', {
              graph: getGraph(data.graphId),
              error: data.error,
              successful: data.successful,
            });
          })
          .with({ type: 'nodeStart' }, async ({ data }) => {
            const node = getNode(data.nodeId);
            this.#emitter.emit('nodeStart', {
              node: getNode(data.nodeId),
              inputs: data.inputs,
              processId: data.processId,
            });

            // Every time a chat node starts, we wait for the playback interval
            if (node.type === 'chat') {
              await new Promise((resolve) => setTimeout(resolve, this.recordingPlaybackChatLatency));
            }
          })
          .with({ type: 'nodeFinish' }, ({ data }) => {
            const node = getNode(data.nodeId);
            this.#emitter.emit('nodeFinish', {
              node,
              outputs: data.outputs,
              processId: data.processId,
            });

            this.#nodeResults.set(data.nodeId, data.outputs);
            this.#visitedNodes.add(data.nodeId);
          })
          .with({ type: 'nodeError' }, ({ data }) => {
            this.#emitter.emit('nodeError', {
              node: getNode(data.nodeId),
              error: data.error,
              processId: data.processId,
            });

            this.#erroredNodes.set(data.nodeId, data.error);
            this.#visitedNodes.add(data.nodeId);
          })
          .with({ type: 'nodeExcluded' }, ({ data }) => {
            this.#emitter.emit('nodeExcluded', {
              node: getNode(data.nodeId),
              processId: data.processId,
            });

            this.#visitedNodes.add(data.nodeId);
          })
          .with({ type: 'nodeOutputsCleared' }, () => {})
          .with({ type: 'partialOutput' }, () => {})
          .with({ type: 'userInput' }, ({ data }) => {
            this.#emitter.emit('userInput', {
              callback: undefined!,
              inputs: data.inputs,
              node: getNode(data.nodeId) as UserInputNode,
              processId: data.processId,
            });
          })
          .with({ type: P.string.startsWith('globalSet:') }, ({ type, data }) => {
            this.#emitter.emit(type, data);
          })
          .with({ type: P.string.startsWith('userEvent:') }, ({ type, data }) => {
            this.#emitter.emit(type, data);
          })
          .with(undefined, () => {})
          .exhaustive();
      }
    } catch (err) {
      this.#emitter.emit('error', { error: getError(err) });
    } finally {
      this.#running = false;
    }

    return this.#graphOutputs;
  }

  #initProcessState() {
    this.#running = true;
    this.#nodeResults = new Map();
    this.#erroredNodes = new Map();
    this.#visitedNodes = new Set();
    this.#currentlyProcessing = new Set();
    this.#remainingNodes = new Set(this.#graph.nodes.map((n) => n.id));
    this.#pendingUserInputs = {};
    this.#processingQueue = new PQueue({ concurrency: Infinity });
    this.#graphOutputs = {};
    this.#executionCache ??= new Map();
    this.#queuedNodes = new Set();
    this.#loopControllersSeen = new Set();
    this.#subprocessors = new Set();
    this.#attachedNodeData = new Map();
    this.#globals ??= new Map();
    this.#ignoreNodes = new Set();

    this.#abortController = new AbortController();
    this.#abortController.signal.addEventListener('abort', () => {
      this.#aborted = true;
    });
    this.#aborted = false;
    this.#abortError = undefined;
    this.#abortSuccessfully = false;
    this.#nodeAbortControllers = new Map();
  }

  /** Main function for running a graph. Runs a graph and returns the outputs from the output nodes of the graph. */
  async processGraph(
    /** Required and optional context available to the nodes and all subgraphs. */
    context: ProcessContext,

    /** Inputs to the main graph. You should pass all inputs required by the GraphInputNodes of the graph. */
    inputs: Record<string, DataValue> = {},

    /** Contextual data available to all graphs and subgraphs. Kind of like react context, avoids drilling down data into subgraphs. Be careful when using it. */
    contextValues: Record<string, DataValue> = {},
  ): Promise<GraphOutputs> {
    try {
      if (this.#running) {
        throw new Error('Cannot process graph while already processing');
      }

      this.#initProcessState();

      this.#context = context;
      this.#graphInputs = inputs;
      this.#contextValues ??= contextValues;

      if (!this.#isSubProcessor) {
        this.#emitter.emit('start', {
          contextValues: this.#contextValues,
          inputs: this.#graphInputs,
          project: this.#project,
        });
      }

      this.#emitter.emit('graphStart', { graph: this.#graph, inputs: this.#graphInputs });

      const startNodes = this.runToNodeIds
        ? this.#graph.nodes.filter((node) => this.runToNodeIds?.includes(node.id))
        : this.#graph.nodes.filter((node) => this.#outputNodesFrom(node).nodes.length === 0);

      await this.#waitUntilUnpaused();

      for (const startNode of startNodes) {
        this.#processingQueue.add(async () => {
          await this.#fetchNodeDataAndProcessNode(startNode);
        });
      }

      // Anything not queued at this phase here should be ignored
      if (this.runToNodeIds) {
        // For safety, we'll only activate this if runToNodeIds is set, in case there are bugs in the first pass
        for (const node of this.#graph.nodes) {
          if (this.#queuedNodes.has(node.id) === false) {
            this.#ignoreNodes.add(node.id);
          }
        }
      }

      await this.#processingQueue.onIdle();

      // If we've aborted successfully, we can treat the graph like it succeeded
      const erroredNodes = [...this.#erroredNodes.entries()].filter(([nodeId]) => {
        const erroredNodeAttachedData = this.#getAttachedDataTo(nodeId);
        return erroredNodeAttachedData.races == null || erroredNodeAttachedData.races.completed === false;
      });
      if (erroredNodes.length && !this.#abortSuccessfully) {
        const error =
          this.#abortError ??
          Error(
            `Graph ${this.#graph.metadata!.name} (${
              this.#graph.metadata!.id
            }) failed to process due to errors in nodes: ${erroredNodes
              .map(([nodeId, error]) => `${this.#nodesById[nodeId]!.title} (${nodeId}): ${error}`)
              .join(', ')}`,
          );

        this.#emitter.emit('graphError', { graph: this.#graph, error });

        if (!this.#isSubProcessor) {
          this.#emitter.emit('error', { error });
        }

        throw error;
      }

      if (this.#graphOutputs['cost' as PortId] == null) {
        this.#graphOutputs['cost' as PortId] = {
          type: 'number',
          value: this.#totalCost,
        };
      }

      const outputValues = this.#graphOutputs;

      this.#running = false;

      this.#emitter.emit('graphFinish', { graph: this.#graph, outputs: outputValues });

      if (!this.#isSubProcessor) {
        this.#emitter.emit('done', { results: outputValues });
      }

      return outputValues;
    } finally {
      this.#running = false;
    }
  }

  async #fetchNodeDataAndProcessNode(node: ChartNode): Promise<void> {
    if (this.#currentlyProcessing.has(node.id) || this.#queuedNodes.has(node.id)) {
      return;
    }

    if (this.#nodeResults.has(node.id) || this.#erroredNodes.has(node.id)) {
      return;
    }

    const inputNodes = this.#inputNodesTo(node);

    // Check if all input nodes are free of errors
    for (const inputNode of inputNodes) {
      if (this.#erroredNodes.has(inputNode.id)) {
        return;
      }
    }

    // Check if all required inputs have connections and if the connected output nodes have been visited
    const connections = this.#connections[node.id] ?? [];
    const inputsReady = this.#definitions[node.id]!.inputs.every((input) => {
      const connectionToInput = connections?.find((conn) => conn.inputId === input.id && conn.inputNodeId === node.id);
      return connectionToInput || !input.required;
    });

    if (!inputsReady) {
      return;
    }
    this.#emitter.emit(
      'trace',
      `Node ${node.title} has required inputs nodes: ${inputNodes.map((n) => n.title).join(', ')}`,
    );

    const attachedData = this.#getAttachedDataTo(node);

    if (node.type === 'raceInputs' || attachedData.races) {
      for (const inputNode of inputNodes) {
        const inputNodeAttachedData = this.#getAttachedDataTo(inputNode);
        const raceIds = new Set<RaceId>([...(attachedData.races?.raceIds ?? ([] as RaceId[]))]);

        if (node.type === 'raceInputs') {
          raceIds.add(`race-${node.id}` as RaceId);
        }

        inputNodeAttachedData.races = {
          propagate: false,
          raceIds: [...raceIds],
          completed: false,
        };
      }
    }

    this.#queuedNodes.add(node.id);

    this.#processingQueue.addAll(
      inputNodes.map((inputNode) => {
        return async () => {
          this.#emitter.emit('trace', `Fetching required data for node ${inputNode.title} (${inputNode.id})`);
          await this.#fetchNodeDataAndProcessNode(inputNode);
        };
      }),
    );

    await this.#processNodeIfAllInputsAvailable(node);
  }

  /** If all inputs are present, all conditions met, processes the node. */
  async #processNodeIfAllInputsAvailable(node: ChartNode): Promise<void> {
    const builtInNode = node as BuiltInNodes;

    if (this.#ignoreNodes.has(node.id)) {
      this.#emitter.emit('trace', `Node ${node.title} is ignored`);
      return;
    }

    if (this.#currentlyProcessing.has(node.id)) {
      this.#emitter.emit('trace', `Node ${node.title} is already being processed`);
      return;
    }

    // For a loop controller, it can run multiple times, otherwise we already processed this node so bail out
    if (this.#visitedNodes.has(node.id) && node.type !== 'loopController') {
      this.#emitter.emit('trace', `Node ${node.title} has already been processed`);
      return;
    }

    if (this.#erroredNodes.has(node.id)) {
      this.#emitter.emit('trace', `Node ${node.title} has already errored`);
      return;
    }

    const inputNodes = this.#inputNodesTo(node);

    // Check if all input nodes are free of errors
    for (const inputNode of inputNodes) {
      if (this.#erroredNodes.has(inputNode.id)) {
        this.#emitter.emit('trace', `Node ${node.title} has errored input node ${inputNode.title}`);
        return;
      }
    }

    // Check if all required inputs have connections and if the connected output nodes have been visited
    const connections = this.#connections[node.id] ?? [];
    const inputsReady = this.#definitions[node.id]!.inputs.every((input) => {
      const connectionToInput = connections?.find((conn) => conn.inputId === input.id && conn.inputNodeId === node.id);
      return connectionToInput || !input.required;
    });

    if (!inputsReady) {
      this.#emitter.emit(
        'trace',
        `Node ${node.title} has required inputs nodes: ${inputNodes.map((n) => n.title).join(', ')}`,
      );
      return;
    }

    // Excluded because control flow is still in a loop - difference between "will not execute" and "has not executed yet"
    const inputValues = this.#getInputValuesForNode(node);

    if (this.#excludedDueToControlFlow(node, inputValues, nanoid() as ProcessId, 'loop-not-broken')) {
      this.#emitter.emit('trace', `Node ${node.title} is excluded due to control flow`);
      return;
    }

    let waitingForInputNode: false | string = false;
    const anyInputIsValid = Object.values(inputValues).some(
      (value) => value && value.type.includes('control-flow-excluded') === false,
    );
    for (const inputNode of inputNodes) {
      // For loop controllers, allow nodes in the same cycle to be not processed yet,
      // but if we're in a 2nd iteration, we do need to wait for them
      if (
        node.type === 'loopController' &&
        !this.#loopControllersSeen.has(node.id) &&
        this.#nodesAreInSameCycle(node.id, inputNode.id)
      ) {
        continue;
      }

      // Only one visited node required for a raceInputs node
      if (node.type === 'raceInputs' && this.#visitedNodes.has(inputNode.id) && anyInputIsValid) {
        waitingForInputNode = false;
        break;
      }

      if (waitingForInputNode === false && this.#visitedNodes.has(inputNode.id) === false) {
        waitingForInputNode = inputNode.title;
      }
    }

    if (waitingForInputNode) {
      this.#emitter.emit('trace', `Node ${node.title} is waiting for input node ${waitingForInputNode}`);
      return;
    }

    this.#currentlyProcessing.add(node.id);

    if (node.type === 'loopController') {
      this.#loopControllersSeen.add(node.id);
    }

    const attachedData = this.#getAttachedDataTo(node);

    if (attachedData.loopInfo && attachedData.loopInfo.loopControllerId !== node.id) {
      attachedData.loopInfo.nodes.add(node.id);
    }

    if (attachedData.races?.completed) {
      this.#emitter.emit('trace', `Node ${node.title} is part of a race that was completed`);
      return;
    }

    const processId = await this.#processNode(node);

    if (this.slowMode) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    this.#emitter.emit('trace', `Finished processing node ${node.title} (${node.id})`);
    this.#visitedNodes.add(node.id);
    this.#currentlyProcessing.delete(node.id);
    this.#remainingNodes.delete(node.id);

    const outputNodes = this.#outputNodesFrom(node);

    // Aggressive - each iteration of the loop controller, we clear everything in the same cycle as the controller
    if (node.type === 'loopController') {
      const loopControllerResults = this.#nodeResults.get(node.id)!;

      // If the loop controller is excluded, we have to "break" it or else it'll loop forever...
      const didBreak =
        loopControllerResults['break' as PortId]?.type !== 'control-flow-excluded' ??
        this.#excludedDueToControlFlow(node, this.#getInputValuesForNode(node), nanoid() as ProcessId);

      if (!didBreak) {
        this.#emitter.emit('trace', `Loop controller ${node.title} did not break, so we're looping again`);
        for (const loopNodeId of attachedData.loopInfo?.nodes ?? []) {
          const cycleNode = this.#nodesById[loopNodeId]!;
          this.#emitter.emit('trace', `Clearing cycle node ${cycleNode.title} (${cycleNode.id})`);
          this.#visitedNodes.delete(cycleNode.id);
          this.#currentlyProcessing.delete(cycleNode.id);
          this.#remainingNodes.add(cycleNode.id);
          this.#nodeResults.delete(cycleNode.id);
        }
      }
    }

    // Abort everything the race depends on - everything already executed won't
    // be aborted, but everything that hasn't will be, effectively terminating all slower branches
    if (node.type === 'raceInputs') {
      const allNodesForRace = [...this.#attachedNodeData.entries()].filter(([, { races }]) =>
        races?.raceIds.includes(`race-${node.id}` as RaceId),
      );
      for (const [nodeId] of allNodesForRace) {
        for (const [key, abortController] of this.#nodeAbortControllers.entries()) {
          if (key.startsWith(nodeId)) {
            this.#emitter.emit('trace', `Aborting node ${nodeId} because other race branch won`);
            abortController.abort();
          }
        }

        // Mark every attached data as completed for the race
        for (const [, nodeAttachedData] of [...this.#attachedNodeData.entries()]) {
          if (nodeAttachedData.races?.raceIds.includes(`race-${node.id}` as RaceId)) {
            nodeAttachedData.races.completed = true;
          }
        }
      }
    }

    let childLoopInfo = attachedData.loopInfo;
    if (builtInNode.type === 'loopController') {
      if (childLoopInfo != null && childLoopInfo.loopControllerId !== builtInNode.id) {
        this.#nodeErrored(node, new Error('Nested loops are not supported'), processId);
        return;
      }

      childLoopInfo = {
        propagate: (parent, connectionsFromParent) => {
          if (
            parent.type === 'loopController' &&
            connectionsFromParent.some((c) => c.outputId === ('break' as PortId))
          ) {
            return false;
          }
          return true;
        },

        loopControllerId: node.id,

        // We want to be able to clear every node that _potentially_ could run in the loop
        nodes: childLoopInfo?.nodes ?? new Set(),

        iterationCount: (childLoopInfo?.iterationCount ?? 0) + 1,
      };

      attachedData.loopInfo = childLoopInfo; // Not 100% sure if this is right - sets the childLoopInfo on the loop controller itself, probably fine?

      if (childLoopInfo.iterationCount > (builtInNode.data.maxIterations ?? 100)) {
        this.#nodeErrored(
          node,
          new Error(
            `Loop controller ${node.title} has exceeded max iterations of ${builtInNode.data.maxIterations ?? 100}`,
          ),
          processId,
        );
        return;
      }
    }

    for (const { node: outputNode, connections: connectionsToOutputNode } of outputNodes.connectionsToNodes) {
      const outputNodeAttachedData = this.#getAttachedDataTo(outputNode);

      const propagatedAttachedData = Object.entries(attachedData).filter(([, value]): boolean => {
        if (!value) {
          return false;
        }

        if (typeof value.propagate === 'boolean') {
          return value.propagate;
        }

        return value.propagate(node, connectionsToOutputNode);
      });

      for (const [key, value] of propagatedAttachedData) {
        outputNodeAttachedData[key] = value;
      }
    }

    // Node is finished, check if we can run any more nodes that depend on this one
    this.#processingQueue.addAll(
      outputNodes.nodes.map((outputNode) => async () => {
        this.#emitter.emit(
          'trace',
          `Trying to run output node from ${node.title}: ${outputNode.title} (${outputNode.id})`,
        );

        await this.#processNodeIfAllInputsAvailable(outputNode);
      }),
    );
  }

  #getAttachedDataTo(node: ChartNode | NodeId): AttachedNodeData {
    const nodeId = typeof node === 'string' ? node : node.id;
    let nodeData = this.#attachedNodeData.get(nodeId);
    if (nodeData == null) {
      nodeData = {};
      this.#attachedNodeData.set(nodeId, nodeData);
    }
    return nodeData;
  }

  async #processNode(node: ChartNode) {
    const processId = nanoid() as ProcessId;
    const builtInNode = node as BuiltInNodes;

    if (this.#abortController.signal.aborted) {
      this.#nodeErrored(node, new Error('Processing aborted'), processId);
      return processId;
    }

    const inputNodes = this.#inputNodesTo(node);
    const erroredInputNodes = inputNodes.filter((inputNode) => this.#erroredNodes.has(inputNode.id));
    if (erroredInputNodes.length > 0) {
      const error = new Error(
        `Cannot process node ${node.title} (${node.id}) because it depends on errored nodes: ${erroredInputNodes
          .map((n) => `${n.title} (${n.id})`)
          .join(', ')}`,
      );
      this.#nodeErrored(node, error, processId);
      return processId;
    }

    if (this.#isNodeOfType('userInput', node)) {
      await this.#processUserInputNode(node, processId);
    } else if (node.isSplitRun) {
      await this.#processSplitRunNode(node, processId);
    } else {
      await this.#processNormalNode(node, processId);
    }

    return processId;
  }

  #isNodeOfType<T extends BuiltInNodes['type']>(type: T, node: ChartNode): node is Extract<BuiltInNodes, { type: T }> {
    return node.type === type;
  }

  async #processUserInputNode(node: UserInputNode, processId: ProcessId) {
    try {
      const inputValues = this.#getInputValuesForNode(node);
      if (this.#excludedDueToControlFlow(node, inputValues, processId)) {
        return;
      }

      this.#emitter.emit('nodeStart', { node, inputs: inputValues, processId });

      const results = await new Promise<StringArrayDataValue>((resolve, reject) => {
        this.#pendingUserInputs[node.id] = {
          resolve,
          reject,
        };

        this.#abortController.signal.addEventListener('abort', () => {
          delete this.#pendingUserInputs[node.id];
          reject(new Error('Processing aborted'));
        });

        this.#emitter.emit('userInput', {
          node,
          inputs: inputValues,
          callback: (results) => {
            resolve(results);

            delete this.#pendingUserInputs[node.id];
          },
          processId,
        });
      });

      const outputValues = (this.#nodeInstances[node.id] as UserInputNodeImpl).getOutputValuesFromUserInput(
        inputValues,
        results,
      );

      this.#nodeResults.set(node.id, outputValues);
      this.#visitedNodes.add(node.id);

      this.#emitter.emit('nodeFinish', { node, outputs: outputValues, processId });
    } catch (e) {
      this.#nodeErrored(node, e, processId);
    }
  }

  async #processSplitRunNode(node: ChartNode, processId: ProcessId) {
    const inputValues = this.#getInputValuesForNode(node);

    if (this.#excludedDueToControlFlow(node, inputValues, processId)) {
      return;
    }

    const splittingAmount = Math.min(
      max(values(inputValues).map((value) => (Array.isArray(value?.value) ? value?.value.length : 1))) ?? 1,
      node.splitRunMax ?? 10,
    );

    this.#emitter.emit('nodeStart', { node, inputs: inputValues, processId });

    try {
      const results = await Promise.all(
        range(0, splittingAmount).map(async (i) => {
          const inputs = fromEntries(
            entries(inputValues).map(([port, value]) => [
              port as PortId,
              isArrayDataValue(value) ? arrayizeDataValue(value)[i] ?? undefined : value,
            ]),
          );

          try {
            const output = await this.#processNodeWithInputData(
              node,
              inputs as Inputs,
              i,
              processId,
              (node, partialOutputs, index) =>
                this.#emitter.emit('partialOutput', { node, outputs: partialOutputs, index, processId }),
            );
            return { type: 'output', output };
          } catch (error) {
            return { type: 'error', error: getError(error) };
          }
        }),
      );

      const errors = results.filter((r) => r.type === 'error').map((r) => r.error!);
      if (errors.length === 1) {
        const e = errors[0]!;
        throw e;
      } else if (errors.length > 0) {
        throw new Error(errors.join('\n'));
      }

      // Combine the parallel results into the final output

      // Turn a Record<PortId, DataValue[]> into a Record<PortId, AnyArrayDataValue>
      const aggregateResults = results.reduce((acc, result) => {
        for (const [portId, value] of entries(result.output!)) {
          acc[portId as PortId] ??= { type: (value?.type + '[]') as DataValue['type'], value: [] } as DataValue;
          (acc[portId as PortId] as ArrayDataValue<AnyDataValue>).value.push(value?.value);
        }
        return acc;
      }, {} as Outputs);

      this.#nodeResults.set(node.id, aggregateResults);
      this.#visitedNodes.add(node.id);
      this.#totalCost += sum(results.map((r) => coerceTypeOptional(r.output?.['cost' as PortId], 'number') ?? 0));
      this.#emitter.emit('nodeFinish', { node, outputs: aggregateResults, processId });
    } catch (error) {
      this.#nodeErrored(node, error, processId);
    }
  }

  async #processNormalNode(node: ChartNode, processId: ProcessId) {
    const inputValues = this.#getInputValuesForNode(node);

    if (this.#excludedDueToControlFlow(node, inputValues, processId)) {
      return;
    }

    this.#emitter.emit('nodeStart', { node, inputs: inputValues, processId });

    try {
      const outputValues = await this.#processNodeWithInputData(
        node,
        inputValues,
        0,
        processId,
        (node, partialOutputs, index) =>
          this.#emitter.emit('partialOutput', { node, outputs: partialOutputs, index, processId }),
      );

      this.#nodeResults.set(node.id, outputValues);
      this.#visitedNodes.add(node.id);
      if (outputValues['cost' as PortId]?.type === 'number') {
        this.#totalCost += coerceTypeOptional(outputValues['cost' as PortId], 'number') ?? 0;
      }
      this.#emitter.emit('nodeFinish', { node, outputs: outputValues, processId });
    } catch (error) {
      this.#nodeErrored(node, error, processId);
    }
  }

  #nodeErrored(node: ChartNode, e: unknown, processId: ProcessId) {
    const error = getError(e);
    this.#emitter.emit('nodeError', { node, error, processId });
    this.#emitter.emit('trace', `Node ${node.title} (${node.id}-${processId}) errored: ${error.stack}`);
    this.#erroredNodes.set(node.id, error.toString());
  }

  getRootProcessor(): GraphProcessor {
    let processor: GraphProcessor = this;
    while (processor.#parent) {
      processor = processor.#parent;
    }
    return processor;
  }

  /** Raise a user event on the processor, all subprocessors, and their children. */
  raiseEvent(event: string, data: DataValue) {
    this.#emitter.emit(`userEvent:${event}`, data);

    for (const subprocessor of this.#subprocessors) {
      subprocessor.raiseEvent(event, data);
    }
  }

  async #processNodeWithInputData(
    node: ChartNode,
    inputValues: Inputs,
    index: number,
    processId: ProcessId,
    partialOutput?: (node: ChartNode, partialOutputs: Outputs, index: number) => void,
  ) {
    const instance = this.#nodeInstances[node.id]!;
    const nodeAbortController = new AbortController();
    this.#nodeAbortControllers.set(`${node.id}-${processId}`, nodeAbortController);
    this.#abortController.signal.addEventListener('abort', () => {
      nodeAbortController.abort();
    });

    const plugin = this.#registry.getPluginFor(node.type);

    const context: InternalProcessContext = {
      ...this.#context,
      project: this.#project,
      executionCache: this.#executionCache,
      graphInputs: this.#graphInputs,
      graphOutputs: this.#graphOutputs,
      waitEvent: async (event) => {
        return new Promise((resolve, reject) => {
          this.#emitter.once(`userEvent:${event}`).then(resolve).catch(reject);
          nodeAbortController.signal.addEventListener('abort', () => {
            reject(new Error('Process aborted'));
          });
        });
      },
      raiseEvent: (event, data) => {
        this.getRootProcessor().raiseEvent(event, data as DataValue);
      },
      contextValues: this.#contextValues,
      externalFunctions: { ...this.#externalFunctions },
      onPartialOutputs: (partialOutputs) => {
        partialOutput?.(node, partialOutputs, index);

        const { useAsGraphPartialOutput } = (node.data as { useAsGraphPartialOutput?: boolean } | undefined) ?? {};

        if (useAsGraphPartialOutput && this.#executor && this.#parent) {
          const executorNode = this.#parent.#nodesById[this.#executor.nodeId];
          if (executorNode) {
            this.#emitter.emit('partialOutput', {
              index: this.#executor.index,
              node: executorNode,
              outputs: partialOutputs,
              processId: this.#executor.processId,
            });
          }
        }
      },
      signal: nodeAbortController.signal,
      processId,
      getGlobal: (id) => this.#globals.get(id),
      setGlobal: (id, value) => {
        this.#globals.set(id, value);
        this.#emitter.emit('globalSet', { id, value, processId });
      },
      waitForGlobal: async (id) => {
        if (this.#globals.has(id)) {
          return this.#globals.get(id)!;
        }
        await this.getRootProcessor().#emitter.once(`globalSet:${id}`);
        return this.#globals.get(id)!;
      },
      createSubProcessor: (subGraphId: GraphId, { signal }: { signal?: AbortSignal } = {}) => {
        const processor = new GraphProcessor(this.#project, subGraphId);
        processor.#isSubProcessor = true;
        processor.#executionCache = this.#executionCache;
        processor.#externalFunctions = this.#externalFunctions;
        processor.#contextValues = this.#contextValues;
        processor.#parent = this;
        processor.#globals = this.#globals;
        processor.#executor = {
          nodeId: node.id,
          index,
          processId,
        };
        processor.on('nodeError', (e) => this.#emitter.emit('nodeError', e));
        processor.on('nodeFinish', (e) => this.#emitter.emit('nodeFinish', e));
        processor.on('partialOutput', (e) => this.#emitter.emit('partialOutput', e));
        processor.on('nodeExcluded', (e) => this.#emitter.emit('nodeExcluded', e));
        processor.on('nodeStart', (e) => this.#emitter.emit('nodeStart', e));
        processor.on('graphAbort', (e) => this.#emitter.emit('graphAbort', e));
        processor.on('userInput', (e) => this.#emitter.emit('userInput', e)); // TODO!
        processor.on('graphStart', (e) => this.#emitter.emit('graphStart', e));
        processor.on('graphFinish', (e) => this.#emitter.emit('graphFinish', e));
        processor.on('globalSet', (e) => this.#emitter.emit('globalSet', e));
        processor.on('pause', () => {
          if (!this.#isPaused) {
            this.pause();
          }
        });
        processor.on('resume', () => {
          if (this.#isPaused) {
            this.resume();
          }
        });

        processor.onAny((event, data) => {
          if (event.startsWith('globalSet:')) {
            this.#emitter.emit(event, data);
          }
        });

        this.#subprocessors.add(processor);

        if (signal) {
          signal.addEventListener('abort', () => processor.abort());
        }

        // If parent is aborted, abort subgraph with error (it's fine, success state is on the parent)
        this.#abortController.signal.addEventListener('abort', () => processor.abort());

        this.on('pause', () => processor.pause());
        this.on('resume', () => processor.resume());

        return processor;
      },
      trace: (message) => {
        this.#emitter.emit('trace', message);
      },
      abortGraph: (error) => {
        this.abort(error === undefined, error);
      },
      getPluginConfig: (name) => {
        if (!plugin) {
          return undefined;
        }

        const configSpec = plugin?.configSpec?.[name];

        if (!configSpec) {
          return undefined;
        }

        const pluginSettings = this.#context.settings.pluginSettings?.[plugin.id];
        if (pluginSettings) {
          const value = pluginSettings[name];
          if (!value || typeof value !== 'string') {
            return undefined;
          }

          return value;
        }

        const envFallback = (configSpec as StringPluginConfigurationSpec).pullEnvironmentVariable;
        const envFallbackName = envFallback === true ? name : envFallback;

        if (envFallbackName && this.#context.settings.pluginEnv?.[envFallbackName]) {
          return this.#context.settings.pluginEnv[envFallbackName];
        }

        return undefined;
      },
    };

    await this.#waitUntilUnpaused();
    const results = await instance.process(inputValues, context);
    this.#nodeAbortControllers.delete(`${node.id}-${processId}`);

    if (nodeAbortController.signal.aborted) {
      throw new Error('Aborted');
    }

    return results;
  }

  #excludedDueToControlFlow(
    node: ChartNode,
    inputValues: Inputs,
    processId: ProcessId,
    typeOfExclusion: ControlFlowExcludedDataValue['value'] = undefined,
  ) {
    const inputValuesList = values(inputValues);
    const controlFlowExcludedValues = inputValuesList.filter(
      (value) =>
        value &&
        getScalarTypeOf(value.type) === 'control-flow-excluded' &&
        (!typeOfExclusion || value.value === typeOfExclusion),
    );
    const inputIsExcludedValue = inputValuesList.length > 0 && controlFlowExcludedValues.length > 0;

    const inputConnections = this.#connections[node.id]?.filter((conn) => conn.inputNodeId === node.id) ?? [];
    const outputNodes = inputConnections
      .map((conn) => this.#nodesById[conn.outputNodeId])
      .filter(isNotNull) as ChartNode[];

    const anyOutputIsExcludedValue =
      outputNodes.length > 0 &&
      outputNodes.some((outputNode) => {
        const outputValues = this.#nodeResults.get(outputNode.id) ?? {};
        const outputControlFlowExcluded = outputValues[ControlFlowExcluded as unknown as PortId];
        if (outputControlFlowExcluded && (!typeOfExclusion || outputControlFlowExcluded.value === typeOfExclusion)) {
          return true;
        }
        return false;
      });

    const isWaitingForLoop = controlFlowExcludedValues.some((value) => value?.value === 'loop-not-broken');

    const nodesAllowedToConsumeExcludedValue: BuiltInNodeType[] = [
      'if',
      'ifElse',
      'coalesce',
      'graphOutput',
      'raceInputs',
    ];

    const allowedToConsumedExcludedValue =
      nodesAllowedToConsumeExcludedValue.includes(node.type as BuiltInNodeType) && !isWaitingForLoop;

    if ((inputIsExcludedValue || anyOutputIsExcludedValue) && !allowedToConsumedExcludedValue) {
      if (!isWaitingForLoop) {
        this.#emitter.emit('trace', `Excluding node ${node.title} because of control flow.`);
        this.#emitter.emit('nodeExcluded', { node, processId });
        this.#visitedNodes.add(node.id);
        this.#nodeResults.set(node.id, {
          [ControlFlowExcluded as unknown as PortId]: { type: 'control-flow-excluded', value: undefined },
        });
      }

      return true;
    }

    return false;
  }

  #getInputValuesForNode(node: ChartNode): Inputs {
    const connections = this.#connections[node.id];
    return this.#definitions[node.id]!.inputs.reduce((values, input) => {
      if (!connections) {
        return values;
      }
      const connection = connections.find((conn) => conn.inputId === input.id && conn.inputNodeId === node.id);
      if (connection) {
        const outputNode = this.#nodeInstances[connection.outputNodeId]!.chartNode;
        const outputNodeOutputs = this.#nodeResults.get(outputNode.id);
        const outputResult = outputNodeOutputs?.[connection.outputId];

        values[input.id] = outputResult;

        if (outputNodeOutputs?.[ControlFlowExcludedPort]) {
          values[ControlFlowExcludedPort] = {
            type: 'control-flow-excluded',
            value: undefined,
          };
        }
      }
      return values;
    }, {} as Record<string, any>);
  }

  /** Gets the nodes that are inputting to the given node. */
  #inputNodesTo(node: ChartNode): ChartNode[] {
    const connections = this.#connections[node.id];
    if (!connections) {
      return [];
    }

    const connectionsToNode = connections.filter((conn) => conn.inputNodeId === node.id).filter(isNotNull);

    // Filter out invalid connections
    const inputDefinitions = this.#definitions[node.id]?.inputs ?? [];
    return connectionsToNode
      .filter((connection) => {
        const connectionDefinition = inputDefinitions.find((def) => def.id === connection.inputId);
        return connectionDefinition != null;
      })
      .map((conn) => this.#nodesById[conn.outputNodeId])
      .filter(isNotNull);
  }

  /** Gets the nodes that the given node it outputting to. */
  #outputNodesFrom(node: ChartNode): {
    nodes: ChartNode[];
    connections: NodeConnection[];
    connectionsToNodes: { connections: NodeConnection[]; node: ChartNode }[];
  } {
    const connections = this.#connections[node.id];
    if (!connections) {
      return { nodes: [], connections: [], connectionsToNodes: [] };
    }

    const connectionsToNode = connections.filter((conn) => conn.outputNodeId === node.id);

    // Filter out invalid connections
    const outputDefinitions = this.#definitions[node.id]?.outputs ?? [];
    const outputConnections = connectionsToNode.filter((connection) => {
      const connectionDefinition = outputDefinitions.find((def) => def.id === connection.outputId);
      return connectionDefinition != null;
    });

    const outputNodes = uniqBy(
      outputConnections.map((conn) => this.#nodesById[conn.inputNodeId]).filter(isNotNull),
      (x) => x.id,
    );

    const connectionsToNodes: { connections: NodeConnection[]; node: ChartNode }[] = [];

    outputNodes.forEach((node) => {
      const connections = outputConnections.filter((conn) => conn.inputNodeId === node.id);
      connectionsToNodes.push({ connections, node });
    });

    return { nodes: outputNodes, connections: outputConnections, connectionsToNodes };
  }

  #tarjanSCC(): ChartNode[][] {
    let index = 0;
    const stack: ChartNode[] = [];
    const indices: Map<string, number> = new Map();
    const lowLinks: Map<string, number> = new Map();
    const onStack: Map<string, boolean> = new Map();
    const sccs: ChartNode[][] = [];

    const strongConnect = (node: ChartNode) => {
      indices.set(node.id, index);
      lowLinks.set(node.id, index);
      index++;
      stack.push(node);
      onStack.set(node.id, true);

      const outgoingConnections = this.#connections[node.id]?.filter((conn) => conn.outputNodeId === node.id);
      for (const connection of outgoingConnections ?? []) {
        const successor = this.#nodesById[connection.inputNodeId]!;

        if (!indices.has(successor.id)) {
          strongConnect(successor);
          lowLinks.set(node.id, Math.min(lowLinks.get(node.id)!, lowLinks.get(successor.id)!));
        } else if (onStack.get(successor.id)) {
          lowLinks.set(node.id, Math.min(lowLinks.get(node.id)!, indices.get(successor.id)!));
        }
      }

      if (lowLinks.get(node.id) === indices.get(node.id)) {
        const scc: Array<ChartNode> = [];
        let connectedNode: ChartNode;

        do {
          connectedNode = stack.pop()!;
          onStack.set(connectedNode.id, false);
          scc.push(connectedNode);
        } while (connectedNode.id !== node.id);

        sccs.push(scc);
      }
    };

    for (const node of this.#graph.nodes) {
      if (!indices.has(node.id)) {
        strongConnect(node);
      }
    }

    return sccs;
  }

  #nodeIsInCycle(nodeId: NodeId) {
    return this.#nodesNotInCycle.find((node) => node.id === nodeId) == null;
  }

  #nodesAreInSameCycle(a: NodeId, b: NodeId) {
    return this.#scc.find((cycle) => cycle.find((node) => node.id === a) && cycle.find((node) => node.id === b));
  }
}
