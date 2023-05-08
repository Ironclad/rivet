import { max, range } from 'lodash-es';
import { ControlFlowExcluded } from '../utils/symbols';
import { DataValue, ArrayDataValue, AnyDataValue, StringArrayDataValue } from './DataValue';
import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from './NodeBase';
import { GraphId, NodeGraph } from './NodeGraph';
import { InternalProcessContext, NodeImpl, ProcessContext } from './NodeImpl';
import { Nodes, createNodeInstance } from './Nodes';
import { UserInputNode, UserInputNodeImpl } from './nodes/UserInputNode';
import PQueue from 'p-queue';
import { getError } from '../utils/errors';
import Emittery from 'emittery';
import { entries, fromEntries, values } from '../utils/typeSafety';
import { isNotNull } from '../utils/genericUtilFunctions';
import { GraphOutputNode } from './nodes/GraphOutputNode';
import { GraphInputNode } from './nodes/GraphInputNode';
import { Project } from './Project';

export type ProcessEvents = {
  /** Called when processing has started. */
  start: void;

  /** Called when a node has started processing, with the input values for the node. */
  nodeStart: { node: ChartNode; inputs: Inputs };

  /** Called when a node has finished processing, with the output values for the node. */
  nodeFinish: { node: ChartNode; outputs: Outputs };

  /** Called when a node has errored during processing. */
  nodeError: { node: ChartNode; error: Error };

  /** Called when a node has been excluded from processing. */
  nodeExcluded: { node: ChartNode };

  /** Called when a user input node requires user input. Call the callback when finished, or call userInput() on the GraphProcessor with the results. */
  userInput: { node: UserInputNode; inputs: Inputs; callback: (values: StringArrayDataValue) => void };

  /** Called when a node has partially processed, with the current partial output values for the node. */
  partialOutput: { node: ChartNode; outputs: Outputs; index: number };

  /** Called when processing has completed. */
  done: { results: GraphOutputs };

  /** Called when processing has been aborted. */
  abort: void;
};

export type GraphOutputs = Record<string, DataValue>;
export type GraphInputs = Record<string, DataValue>;

export type NodeResults = Map<NodeId, Outputs>;
export type Inputs = Record<PortId, DataValue>;
export type Outputs = Record<PortId, DataValue>;

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

    this.#emitter.bindMethods(this as any, ['on', 'off', 'once']);

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
        inputs: this.#nodeInstances[node.id]!.getInputDefinitions(this.#connections[node.id] ?? [], this.#project),
        outputs: this.#nodeInstances[node.id]!.getOutputDefinitions(this.#connections[node.id] ?? [], this.#project),
      };
    }
  }

  on = undefined! as Emittery<ProcessEvents>['on'];
  off = undefined! as Emittery<ProcessEvents>['off'];
  once = undefined! as Emittery<ProcessEvents>['once'];

  #nodeIsReady(node: ChartNode): boolean {
    if (this.#erroredNodes.has(node.id) || this.#currentlyProcessing.has(node.id)) {
      return false;
    }

    for (const inputNode of this.#inputNodesTo(node)) {
      if (this.#erroredNodes.has(inputNode.id)) {
        return false;
      }
    }

    const connections = this.#connections[node.id];
    return (
      this.#definitions[node.id]!.inputs.every((input) => {
        const connectionToInput = connections?.find(
          (conn) => conn.inputId === input.id && conn.inputNodeId === node.id,
        );

        if (!input.required && !connectionToInput) {
          return true;
        }

        if (!connectionToInput) {
          return false;
        }

        return this.#visitedNodes.has(connectionToInput.outputNodeId);
      }) || this.#definitions[node.id]!.inputs.length === 0
    );
  }

  userInput(nodeId: NodeId, values: StringArrayDataValue): void {
    const pending = this.#pendingUserInputs[nodeId];
    if (pending) {
      pending.resolve(values as StringArrayDataValue);
      delete this.#pendingUserInputs[nodeId];
    }
  }

  async abort(): Promise<void> {
    if (!this.#running) {
      return Promise.resolve();
    }

    this.#abortController.abort();
    this.#emitter.emit('abort', void 0);

    await this.#processingQueue.onIdle();
  }

  /** Gets the nodes that are inputting to the given node. */
  #inputNodesTo(node: ChartNode): ChartNode[] {
    const connections = this.#connections[node.id];
    if (!connections) {
      return [];
    }

    return connections
      .filter((conn) => conn.outputNodeId === node.id)
      .map((conn) => this.#nodesById[conn.inputNodeId])
      .filter(isNotNull);
  }

  /** Gets the nodes that the given node it outputting to. */
  #outputNodesFrom(node: ChartNode): ChartNode[] {
    const connections = this.#connections[node.id];
    if (!connections) {
      return [];
    }

    return connections
      .filter((conn) => conn.inputNodeId === node.id)
      .map((conn) => this.#nodesById[conn.outputNodeId])
      .filter(isNotNull);
  }

  async processGraph(context: ProcessContext, inputs: Record<string, DataValue> = {}): Promise<GraphOutputs> {
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

    const processNextNodes = async () => {
      const nodesToProcess = this.#graph.nodes.filter((node) => !this.#visitedNodes.has(node.id));

      for (const currentNode of nodesToProcess) {
        if (this.#nodeIsReady(currentNode)) {
          this.#currentlyProcessing.add(currentNode.id);
          this.#processingQueue.add(async () => {
            await this.#processNode(currentNode as Nodes);

            this.#remainingNodes.delete(currentNode.id);
            this.#currentlyProcessing.delete(currentNode.id);

            processNextNodes();
          });
        }
      }
    };

    this.#emitter.emit('start', void 0);

    processNextNodes();
    await this.#processingQueue.onIdle();

    if (this.#remainingNodes.size > 0) {
      throw new Error('There might be a cycle in the graph or an issue with input dependencies.');
    }

    const outputNodes = this.#graph.nodes.filter((node): node is GraphOutputNode =>
      this.#isNodeOfType('graphOutput', node),
    );
    const outputValues = outputNodes.reduce((values, node) => {
      const results = this.#nodeResults.get(node.id);
      if (results) {
        values[node.data.id] = results['value' as PortId]!;
      }
      return values;
    }, {} as GraphOutputs);

    this.#running = false;

    this.#emitter.emit('done', { results: outputValues });

    return outputValues;
  }

  async #processNode(node: Nodes) {
    if (this.#abortController.signal.aborted) {
      this.#nodeErrored(node, new Error('Processing aborted'));
    }

    const inputNodes = this.#inputNodesTo(node);
    const erroredInputNodes = inputNodes.filter((inputNode) => this.#erroredNodes.has(inputNode.id));
    if (erroredInputNodes.length > 0) {
      const error = new Error(
        `Cannot process node ${node.id} because it depends on errored nodes: ${erroredInputNodes
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
      max(values(inputValues).map((value) => (Array.isArray(value.value) ? value.value.length : 1))) ?? 1,
      node.splitRunMax ?? 10,
    );

    this.#emitter.emit('nodeStart', { node, inputs: inputValues });

    try {
      const results = await Promise.all(
        range(0, splittingAmount).map(async (i) => {
          const inputs = fromEntries(
            entries(inputValues).map(([port, value]): [PortId, DataValue] => {
              if (value.type.endsWith('[]')) {
                const newType = value.type.slice(0, -2) as DataValue['type'];
                const newValue: unknown = (value.value as unknown[])[i] ?? undefined;
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
          acc[portId as PortId] ??= { type: (value.type + '[]') as DataValue['type'], value: [] } as DataValue;
          (acc[portId as PortId] as ArrayDataValue<AnyDataValue>).value.push(value.value);
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

  #processGraphInputNode(node: GraphInputNode) {
    let inputValue = this.#graphInputs[node.data.id];
    if (inputValue == null) {
      inputValue = { type: node.data.dataType, value: node.data.defaultValue } as DataValue;
    }

    const outputValues = { ['data' as PortId]: inputValue } as Outputs;

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
    console.error(error);
    this.#erroredNodes.add(node.id);
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
      onPartialOutputs: (partialOutputs) => partialOutput?.(node, partialOutputs, index),
      signal: this.#abortController.signal,
    };

    const results = await instance.process(inputValues, context);
    if (this.#abortController.signal.aborted) {
      throw new Error('Aborted');
    }
    return results;
  }

  #excludedDueToControlFlow(node: ChartNode, inputValues: Inputs) {
    const inputValuesList = values(inputValues);
    const inputIsExcludedValue =
      inputValuesList.length > 0 && inputValuesList.some((value) => value?.type === 'control-flow-excluded');

    const inputConnections = this.#connections[node.id]?.filter((conn) => conn.inputNodeId === node.id) ?? [];
    const outputNodes = inputConnections
      .map((conn) => this.#graph.nodes.find((n) => n.id === conn.outputNodeId))
      .filter((n) => n) as ChartNode[];

    const anyOutputIsExcludedValue =
      outputNodes.length > 0 &&
      outputNodes.some((outputNode) => {
        const outputValues = this.#nodeResults.get(outputNode.id) ?? {};
        if (outputValues[ControlFlowExcluded as unknown as PortId]) {
          return true;
        }
        return false;
      });

    const allowedToConsumedExcludedValue = node.type === 'if' || node.type === 'ifElse';

    if ((inputIsExcludedValue || anyOutputIsExcludedValue) && !allowedToConsumedExcludedValue) {
      this.#emitter.emit('nodeExcluded', { node });
      this.#visitedNodes.add(node.id);
      this.#nodeResults.set(node.id, {
        [ControlFlowExcluded as unknown as PortId]: { type: 'control-flow-excluded', value: undefined },
      });
      return true;
    }

    return false;
  }

  #getInputValuesForNode(node: ChartNode): Record<PortId, DataValue> {
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
}
