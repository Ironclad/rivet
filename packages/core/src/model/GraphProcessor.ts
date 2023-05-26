import { max, range } from 'lodash-es';
import { ControlFlowExcluded, ControlFlowExcludedPort } from '../utils/symbols';
import {
  DataValue,
  ArrayDataValue,
  AnyDataValue,
  StringArrayDataValue,
  ControlFlowExcludedDataValue,
} from './DataValue';
import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from './NodeBase';
import { GraphId, NodeGraph } from './NodeGraph';
import { InternalProcessContext, NodeImpl, ProcessContext } from './NodeImpl';
import { LoopControllerNode, NodeType, Nodes, createNodeInstance } from './Nodes';
import { UserInputNode, UserInputNodeImpl } from './nodes/UserInputNode';
import PQueue from 'p-queue';
import { getError } from '../utils/errors';
import Emittery from 'emittery';
import { entries, fromEntries, values } from '../utils/typeSafety';
import { isNotNull } from '../utils/genericUtilFunctions';
import { GraphOutputNode } from './nodes/GraphOutputNode';
import { GraphInputNode, GraphInputNodeImpl } from './nodes/GraphInputNode';
import { Project } from './Project';
import { nanoid } from 'nanoid';

export type ProcessEvents = {
  /** Called when processing has started. */
  start: void;

  /** Called when a graph or subgraph has started. */
  graphStart: { graph: NodeGraph; inputs: GraphInputs };

  /** Called when a graph or a subgraph has finished. */
  graphFinish: { graph: NodeGraph; outputs: GraphOutputs };

  /** Called when a node has started processing, with the input values for the node. */
  nodeStart: { node: ChartNode; inputs: Inputs };

  /** Called when a node has finished processing, with the output values for the node. */
  nodeFinish: { node: ChartNode; outputs: Outputs };

  /** Called when a node has errored during processing. */
  nodeError: { node: ChartNode; error: Error | string };

  /** Called when a node has been excluded from processing. */
  nodeExcluded: { node: ChartNode };

  /** Called when a user input node requires user input. Call the callback when finished, or call userInput() on the GraphProcessor with the results. */
  userInput: { node: UserInputNode; inputs: Inputs; callback: (values: StringArrayDataValue) => void };

  /** Called when a node has partially processed, with the current partial output values for the node. */
  partialOutput: { node: ChartNode; outputs: Outputs; index: number };

  nodeOutputsCleared: { node: ChartNode };

  /** Called when processing has completed. */
  done: { results: GraphOutputs };

  /** Called when processing has been aborted. */
  abort: void;

  trace: string;

  pause: void;

  resume: void;
} & {
  [key: `userEvent:${string}`]: DataValue | undefined;
};

export type GraphOutputs = Record<string, DataValue>;
export type GraphInputs = Record<string, DataValue>;

export type NodeResults = Map<NodeId, Outputs>;
export type Inputs = Record<PortId, DataValue | undefined>;
export type Outputs = Record<PortId, DataValue | undefined>;

export type ExternalFunction = (...args: unknown[]) => Promise<DataValue>;

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
  id = nanoid();

  // Per-process state
  #erroredNodes: Set<NodeId> = undefined!;
  #remainingNodes: Set<NodeId> = undefined!;
  #visitedNodes: Set<NodeId> = undefined!;
  #currentlyProcessing: Set<NodeId> = undefined!;
  #context: ProcessContext = undefined!;
  #nodeResults: NodeResults = undefined!;
  #abortController: AbortController = undefined!;
  #processingQueue: PQueue = undefined!;
  #graphInputs: GraphInputs = undefined!;
  #graphOutputs: GraphOutputs = undefined!;
  #executionCache: Map<string, unknown> = undefined!;
  #queuedNodes: Set<NodeId> = undefined!;
  #loopControllersSeen: Set<NodeId> = undefined!;
  #subprocessors: Set<GraphProcessor> = undefined!;
  #contextValues: Record<string, DataValue> = undefined!;

  /** User input nodes that are pending user input. */
  #pendingUserInputs: Record<
    NodeId,
    { resolve: (values: StringArrayDataValue) => void; reject: (error: unknown) => void }
  > = undefined!;

  get isRunning() {
    return this.#running;
  }

  constructor(project: Project, graphId: GraphId) {
    this.#project = project;
    const graph = project.graphs[graphId];

    if (!graph) {
      throw new Error(`Graph ${graphId} not found in project`);
    }
    this.#graph = graph;

    this.#nodeInstances = {};
    this.#connections = {};
    this.#nodesById = {};

    this.#emitter.bindMethods(this as any, ['on', 'off', 'once', 'onAny', 'offAny']);

    // Create node instances and store them in a lookup table
    for (const node of this.#graph.nodes) {
      this.#nodeInstances[node.id] = createNodeInstance(node as Nodes);
      this.#nodesById[node.id] = node;
    }

    // Store connections in a lookup table
    for (const conn of this.#graph.connections) {
      if (!this.#connections[conn.inputNodeId]) {
        this.#connections[conn.inputNodeId] = [];
      }
      if (!this.#connections[conn.outputNodeId]) {
        this.#connections[conn.outputNodeId] = [];
      }
      this.#connections[conn.inputNodeId]!.push(conn);
      this.#connections[conn.outputNodeId]!.push(conn);
    }

    // Store input and output definitions in a lookup table
    this.#definitions = {};
    for (const node of this.#graph.nodes) {
      this.#definitions[node.id] = {
        inputs: this.#nodeInstances[node.id]!.getInputDefinitions(
          this.#connections[node.id] ?? [],
          this.#nodesById,
          this.#project,
        ),
        outputs: this.#nodeInstances[node.id]!.getOutputDefinitions(
          this.#connections[node.id] ?? [],
          this.#nodesById,
          this.#project,
        ),
      };
    }

    this.#scc = this.#tarjanSCC();
    this.#nodesNotInCycle = this.#scc.filter((cycle) => cycle.length === 1).flat();

    this.setExternalFunction('echo', async (value) => ({ type: 'any', value: value } satisfies DataValue));
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

  async abort(): Promise<void> {
    if (!this.#running) {
      return Promise.resolve();
    }

    this.#abortController.abort();
    this.#emitter.emit('abort', void 0);

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

  async #fetchNodeDataAndProcessNode(
    node: Nodes,
    cycleInfo?: { loopController: LoopControllerNode; nodes: Set<ChartNode> },
  ): Promise<void> {
    if (this.#currentlyProcessing.has(node.id) || this.#queuedNodes.has(node.id)) {
      return;
    }

    if (this.#nodeResults.has(node.id) || this.#erroredNodes.has(node.id)) {
      return;
    }

    cycleInfo?.nodes.add(node);

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

    this.#queuedNodes.add(node.id);

    this.#processingQueue.addAll(
      inputNodes.map((inputNode) => {
        return async () => {
          this.#emitter.emit('trace', `Fetching required data for node ${inputNode.title} (${inputNode.id})`);
          await this.#fetchNodeDataAndProcessNode(inputNode as Nodes, cycleInfo);
        };
      }),
    );

    await this.#processNodeIfAllInputsAvailable(node);
  }

  /** If all inputs are present, all conditions met, processes the node. */
  async #processNodeIfAllInputsAvailable(
    node: Nodes,
    loopInfo?: {
      /** ID of the controller of the loop */
      loopControllerId: NodeId;

      /** Nodes add themselves to this as the loop processes */
      nodes: Set<NodeId>;

      iterationCount: number;
    },
  ): Promise<void> {
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
    if (node.title === 'Graph Output') {
      this.#emitter.emit('trace', `Node ${node.title} has input values ${JSON.stringify(inputValues)}`);
    }
    if (this.#excludedDueToControlFlow(node, inputValues, 'loop-not-broken')) {
      this.#emitter.emit('trace', `Node ${node.title} is excluded due to control flow`);
      return;
    }

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

      if (this.#visitedNodes.has(inputNode.id) === false) {
        this.#emitter.emit('trace', `Node ${node.title} is waiting for input node ${inputNode.title}`);
        return;
      }
    }

    this.#currentlyProcessing.add(node.id);

    if (node.type === 'loopController') {
      this.#loopControllersSeen.add(node.id);
    }

    if (loopInfo && loopInfo.loopControllerId !== node.id) {
      loopInfo.nodes.add(node.id);
    }

    await this.#processNode(node as Nodes);

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
        this.#excludedDueToControlFlow(node, this.#getInputValuesForNode(node));

      this.#emitter.emit('trace', JSON.stringify(this.#nodeResults.get(node.id)));

      if (!didBreak) {
        for (const loopNodeId of loopInfo?.nodes ?? []) {
          const cycleNode = this.#nodesById[loopNodeId]!;
          this.#emitter.emit('trace', `Clearing cycle node ${cycleNode.title} (${cycleNode.id})`);
          this.#visitedNodes.delete(cycleNode.id);
          this.#currentlyProcessing.delete(cycleNode.id);
          this.#remainingNodes.add(cycleNode.id);
          this.#nodeResults.delete(cycleNode.id);
          // this.#emitter.emit('nodeOutputsCleared', { node: cycleNode });
        }
      }
    }

    let childLoopInfo = loopInfo;
    if (node.type === 'loopController') {
      if (childLoopInfo != null && childLoopInfo.loopControllerId !== node.id) {
        throw new Error('Nested loops are not supported');
      }

      childLoopInfo = {
        loopControllerId: node.id,

        // We want to be able to clear every node that _potentially_ could run in the loop
        nodes: childLoopInfo?.nodes ?? new Set(),

        // TODO loop controller max iterations
        iterationCount: (childLoopInfo?.iterationCount ?? 0) + 1,
      };

      if (childLoopInfo.iterationCount > (node.data.maxIterations ?? 100)) {
        throw new Error(
          `Loop controller ${node.title} has exceeded max iterations of ${node.data.maxIterations ?? 100}`,
        );
      }
    }

    // Node is finished, check if we can run any more nodes that depend on this one
    this.#processingQueue.addAll(
      outputNodes.map((outputNode) => async () => {
        this.#emitter.emit(
          'trace',
          `Trying to run output node from ${node.title}: ${outputNode.title} (${outputNode.id})`,
        );

        await this.#processNodeIfAllInputsAvailable(outputNode as Nodes, childLoopInfo);
      }),
    );
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

      this.#running = true;
      this.#context = context;
      this.#nodeResults = new Map();
      this.#erroredNodes = new Set();
      this.#visitedNodes = new Set();
      this.#currentlyProcessing = new Set();
      this.#remainingNodes = new Set(this.#graph.nodes.map((n) => n.id));
      this.#pendingUserInputs = {};
      this.#abortController = new AbortController();
      this.#processingQueue = new PQueue({ concurrency: Infinity });
      this.#graphInputs = inputs;
      this.#graphOutputs = {};
      this.#executionCache ??= new Map();
      this.#queuedNodes = new Set();
      this.#loopControllersSeen = new Set();
      this.#subprocessors = new Set();

      if (!this.#contextValues) {
        this.#contextValues = contextValues;
      }

      if (!this.#isSubProcessor) {
        this.#emitter.emit('start', void 0);
      }

      this.#emitter.emit('graphStart', { graph: this.#graph, inputs: this.#graphInputs });

      const nodesWithoutOutputs = this.#graph.nodes.filter((node) => this.#outputNodesFrom(node).length === 0);

      await this.#waitUntilUnpaused();

      for (const nodeWithoutOutputs of nodesWithoutOutputs) {
        this.#processingQueue.add(async () => {
          await this.#fetchNodeDataAndProcessNode(nodeWithoutOutputs as Nodes);
        });
      }

      await this.#processingQueue.onIdle();

      if (this.#erroredNodes.size > 0) {
        throw new Error(
          `Graph ${this.#graph.metadata!.name} (${
            this.#graph.metadata!.id
          }) failed to process due to errors in nodes: ${Array.from(this.#erroredNodes)
            .map((nodeId) => `${this.#nodesById[nodeId]!.title} (${nodeId})`)
            .join(', ')}`,
        );
      }

      const outputNodes = this.#graph.nodes.filter(
        (node): node is GraphOutputNode =>
          this.#isNodeOfType('graphOutput', node) &&
          !this.#excludedDueToControlFlow(node, this.#getInputValuesForNode(node)),
      );

      const outputValues = outputNodes.reduce((values, node) => {
        const results = this.#nodeResults.get(node.id);
        if (results) {
          values[node.data.id] = results['value' as PortId]!;
        }
        return values;
      }, {} as GraphOutputs);

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

  async #processNode(node: Nodes) {
    if (this.#abortController.signal.aborted) {
      this.#nodeErrored(node, new Error('Processing aborted'));
    }

    const inputNodes = this.#inputNodesTo(node);
    const erroredInputNodes = inputNodes.filter((inputNode) => this.#erroredNodes.has(inputNode.id));
    if (erroredInputNodes.length > 0) {
      const error = new Error(
        `Cannot process node ${node.title} (${node.id}) because it depends on errored nodes: ${erroredInputNodes
          .map((n) => `${n.title} (${n.id})`)
          .join(', ')}`,
      );
      this.#nodeErrored(node, error);
      return;
    }

    if (this.#isNodeOfType('userInput', node)) {
      await this.#processUserInputNode(node);
    } else if (this.#isNodeOfType('graphInput', node)) {
      this.#processGraphInputNode(node);
    } else if (this.#isNodeOfType('graphOutput', node)) {
      this.#processGraphOutputNode(node);
    } else if (node.isSplitRun) {
      await this.#processSplitRunNode(node);
    } else {
      await this.#processNormalNode(node);
    }
  }

  #isNodeOfType<T extends Nodes['type']>(type: T, node: ChartNode): node is Extract<Nodes, { type: T }> {
    return node.type === type;
  }

  async #processUserInputNode(node: UserInputNode) {
    try {
      const inputValues = this.#getInputValuesForNode(node);
      if (this.#excludedDueToControlFlow(node, inputValues)) {
        return;
      }

      this.#emitter.emit('nodeStart', { node, inputs: inputValues });

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
        });
      });

      const outputValues = (this.#nodeInstances[node.id] as UserInputNodeImpl).getOutputValuesFromUserInput(
        inputValues,
        results,
      );

      this.#nodeResults.set(node.id, outputValues);
      this.#visitedNodes.add(node.id);

      this.#emitter.emit('nodeFinish', { node, outputs: outputValues });
    } catch (e) {
      this.#nodeErrored(node, e);
    }
  }

  async #processSplitRunNode(node: ChartNode) {
    const inputValues = this.#getInputValuesForNode(node);

    if (this.#excludedDueToControlFlow(node, inputValues)) {
      return;
    }

    const splittingAmount = Math.min(
      max(values(inputValues).map((value) => (Array.isArray(value?.value) ? value?.value.length : 1))) ?? 1,
      node.splitRunMax ?? 10,
    );

    this.#emitter.emit('nodeStart', { node, inputs: inputValues });

    try {
      const results = await Promise.all(
        range(0, splittingAmount).map(async (i) => {
          const inputs = fromEntries(
            entries(inputValues).map(([port, value]): [PortId, DataValue | undefined] => {
              const isArray =
                value?.type.endsWith('[]') ||
                ((value?.type === 'any' || value?.type === 'object') && Array.isArray(value?.value));

              if (isArray) {
                const newType = value?.type.endsWith('[]')
                  ? (value.type.slice(0, -2) as DataValue['type'])
                  : value!.type;
                const newValue: unknown = (value!.value as unknown[])[i] ?? undefined;
                return [port as PortId, { type: newType, value: newValue as any }];
              } else {
                return [port as PortId, value];
              }
            }),
          );

          try {
            const output = await this.#processNodeWithInputData(
              node,
              inputs as Inputs,
              i,
              (node, partialOutputs, index) =>
                this.#emitter.emit('partialOutput', { node, outputs: partialOutputs, index }),
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
      this.#emitter.emit('nodeFinish', { node, outputs: aggregateResults });
    } catch (error) {
      this.#nodeErrored(node, error);
    }
  }

  async #processNormalNode(node: ChartNode) {
    const inputValues = this.#getInputValuesForNode(node);

    if (this.#excludedDueToControlFlow(node, inputValues)) {
      return;
    }

    this.#emitter.emit('nodeStart', { node, inputs: inputValues });

    try {
      const outputValues = await this.#processNodeWithInputData(node, inputValues, 0, (node, partialOutputs, index) =>
        this.#emitter.emit('partialOutput', { node, outputs: partialOutputs, index }),
      );

      this.#nodeResults.set(node.id, outputValues);
      this.#visitedNodes.add(node.id);
      this.#emitter.emit('nodeFinish', { node, outputs: outputValues });
    } catch (error) {
      this.#nodeErrored(node, error);
    }
  }

  async #processGraphInputNode(node: GraphInputNode) {
    const inputValues = this.#getInputValuesForNode(node);

    if (this.#excludedDueToControlFlow(node, inputValues)) {
      return;
    }

    this.#emitter.emit('nodeStart', { node, inputs: inputValues });

    const impl = this.#nodeInstances[node.id] as GraphInputNodeImpl;
    const outputValues = await impl.getOutputValuesFromGraphInput(this.#graphInputs, inputValues);

    this.#nodeResults.set(node.id, outputValues);
    this.#visitedNodes.add(node.id);
    this.#emitter.emit('nodeFinish', { node, outputs: outputValues });
  }

  #processGraphOutputNode(node: GraphOutputNode) {
    const inputValues = this.#getInputValuesForNode(node);

    if (this.#excludedDueToControlFlow(node, inputValues)) {
      return;
    }

    const outputValues = inputValues as Outputs;

    this.#nodeResults.set(node.id, outputValues);
    this.#visitedNodes.add(node.id);
    this.#emitter.emit('nodeFinish', { node, outputs: outputValues });
  }

  #nodeErrored(node: ChartNode, e: unknown) {
    const error = getError(e);
    this.#emitter.emit('nodeError', { node, error });
    this.#emitter.emit('trace', `Node ${node.title} (${node.id}) errored: ${error.stack}`);
    this.#erroredNodes.add(node.id);
  }

  getRootProcessor(): GraphProcessor {
    let processor: GraphProcessor = this;
    while (processor.#parent) {
      processor = processor.#parent;
    }
    return processor;
  }

  async #processNodeWithInputData(
    node: ChartNode,
    inputValues: Inputs,
    index: number,
    partialOutput?: (node: ChartNode, partialOutputs: Outputs, index: number) => void,
  ) {
    const instance = this.#nodeInstances[node.id]!;

    const context: InternalProcessContext = {
      ...this.#context,
      project: this.#project,
      executionCache: this.#executionCache,
      raiseEvent: (event, data) => {
        this.#emitter.emit(`userEvent:${event}`, data);
      },
      contextValues: this.#contextValues,
      externalFunctions: { ...this.#externalFunctions },
      onPartialOutputs: (partialOutputs) => partialOutput?.(node, partialOutputs, index),
      signal: this.#abortController.signal,
      createSubProcessor: (subGraphId: GraphId) => {
        const processor = new GraphProcessor(this.#project, subGraphId);
        processor.#isSubProcessor = true;
        processor.#executionCache = this.#executionCache;
        processor.#externalFunctions = this.#externalFunctions;
        processor.#contextValues = this.#contextValues;
        processor.#parent = this;
        processor.on('nodeError', (e) => this.#emitter.emit('nodeError', e));
        processor.on('nodeFinish', (e) => this.#emitter.emit('nodeFinish', e));
        processor.on('partialOutput', (e) => this.#emitter.emit('partialOutput', e));
        processor.on('nodeExcluded', (e) => this.#emitter.emit('nodeExcluded', e));
        processor.on('nodeStart', (e) => this.#emitter.emit('nodeStart', e));
        processor.on('userInput', (e) => this.#emitter.emit('userInput', e)); // TODO!
        processor.on('graphStart', (e) => this.#emitter.emit('graphStart', e));
        processor.on('graphFinish', (e) => this.#emitter.emit('graphFinish', e));
        processor.on('pause', (e) => {
          if (!this.#isPaused) {
            this.pause();
          }
        });
        processor.on('resume', (e) => {
          if (this.#isPaused) {
            this.resume();
          }
        });

        processor.onAny((event, data) => {
          if (event.startsWith('userEvent:')) {
            this.#emitter.emit(event, data);
          }
        });

        this.#subprocessors.add(processor);

        this.on('abort', () => processor.abort());
        this.on('pause', () => processor.pause());
        this.on('resume', () => processor.resume());

        return processor;
      },
    };

    await this.#waitUntilUnpaused();
    const results = await instance.process(inputValues, context);
    if (this.#abortController.signal.aborted) {
      throw new Error('Aborted');
    }
    return results;
  }

  #excludedDueToControlFlow(
    node: ChartNode,
    inputValues: Inputs,
    typeOfExclusion: ControlFlowExcludedDataValue['value'] = undefined,
  ) {
    const inputValuesList = values(inputValues);
    const controlFlowExcludedValues = inputValuesList.filter(
      (value) => value?.type === 'control-flow-excluded' && value.value === typeOfExclusion,
    );
    const inputIsExcludedValue = inputValuesList.length > 0 && controlFlowExcludedValues.length > 0;

    const inputConnections = this.#connections[node.id]?.filter((conn) => conn.inputNodeId === node.id) ?? [];
    const outputNodes = inputConnections
      .map((conn) => this.#graph.nodes.find((n) => n.id === conn.outputNodeId))
      .filter((n) => n) as ChartNode[];

    const anyOutputIsExcludedValue =
      outputNodes.length > 0 &&
      outputNodes.some((outputNode) => {
        const outputValues = this.#nodeResults.get(outputNode.id) ?? {};
        const outputControlFlowExcluded = outputValues[ControlFlowExcluded as unknown as PortId];
        if (outputControlFlowExcluded && outputControlFlowExcluded.value === typeOfExclusion) {
          return true;
        }
        return false;
      });

    // If a node in the same loop outputs control-flow-executed, the loop controller shouldn't be excluded because it'll just iterate again...
    // if (node.type === 'loopController') {
    //   const outputNodesInSameLoop = outputNodes.filter((outputNode) =>
    //     this.#nodesAreInSameCycle(node.id, outputNode.id),
    //   );

    //   const anyOutputNodeNotInSameLoopIsExcludedValue = outputNodes
    //     .filter((outputNode) => !outputNodesInSameLoop.includes(outputNode))
    //     .some((outputNode) => {
    //       const outputValues = this.#nodeResults.get(outputNode.id) ?? {};
    //       const outputControlFlowExcluded = outputValues[ControlFlowExcluded as unknown as PortId];
    //       if (outputControlFlowExcluded && outputControlFlowExcluded.value === typeOfExclusion) {
    //         return true;
    //       }
    //       return false;
    //     });
    //   if (anyOutputNodeNotInSameLoopIsExcludedValue) {
    //     return true;
    //   }

    //   const anyOutputNodeInSameLoopIsExcludedValue =
    //     outputNodesInSameLoop.length > 0 &&
    //     outputNodesInSameLoop.some((outputNode) => {
    //       const outputValues = this.#nodeResults.get(outputNode.id) ?? {};
    //       const outputControlFlowExcluded = outputValues[ControlFlowExcluded as unknown as PortId];
    //       if (outputControlFlowExcluded && outputControlFlowExcluded.value === typeOfExclusion) {
    //         return true;
    //       }
    //       return false;
    //     });
    //   if (anyOutputNodeInSameLoopIsExcludedValue) {
    //     return false;
    //   }
    // }

    const isWaitingForLoop = controlFlowExcludedValues.some((value) => value?.value === 'loop-not-broken');

    const nodesAllowedToConsumeExcludedValue: NodeType[] = ['if', 'ifElse', 'coalesce'];

    const allowedToConsumedExcludedValue =
      nodesAllowedToConsumeExcludedValue.includes(node.type as NodeType) && !isWaitingForLoop;

    if ((inputIsExcludedValue || anyOutputIsExcludedValue) && !allowedToConsumedExcludedValue) {
      if (!isWaitingForLoop) {
        this.#emitter.emit('trace', `Excluding node ${node.title} because of control flow.`);
        this.#emitter.emit('nodeExcluded', { node });
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
        const outputResult = this.#nodeResults.get(outputNode.id)?.[connection.outputId];

        values[input.id] = outputResult;
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
  #outputNodesFrom(node: ChartNode): ChartNode[] {
    const connections = this.#connections[node.id];
    if (!connections) {
      return [];
    }

    const connectionsToNode = connections.filter((conn) => conn.outputNodeId === node.id);

    // Filter out invalid connections
    const outputDefinitions = this.#definitions[node.id]?.outputs ?? [];
    return connectionsToNode
      .filter((connection) => {
        const connectionDefinition = outputDefinitions.find((def) => def.id === connection.outputId);
        return connectionDefinition != null;
      })
      .map((conn) => this.#nodesById[conn.inputNodeId])
      .filter(isNotNull);
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

      const connections = this.#connections[node.id];
      connections?.forEach((conn) => {
        const successor = this.#nodesById[conn.outputNodeId]!;

        if (!indices.has(successor.id)) {
          strongConnect(successor);
          lowLinks.set(node.id, Math.min(lowLinks.get(node.id)!, lowLinks.get(successor.id)!));
        } else if (onStack.get(successor.id)) {
          lowLinks.set(node.id, Math.min(lowLinks.get(node.id)!, indices.get(successor.id)!));
        }
      });

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
