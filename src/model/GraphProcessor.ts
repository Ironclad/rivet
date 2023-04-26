import { max, range, uniqBy } from 'lodash-es';
import { ControlFlowExcluded } from '../utils/symbols';
import { DataValue, ArrayDataValue, AnyDataValue, StringDataValue, expectType, ScalarDataValue } from './DataValue';
import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from './NodeBase';
import { NodeGraph } from './NodeGraph';
import { NodeImpl, ProcessContext } from './NodeImpl';
import { Nodes, createNodeInstance } from './Nodes';
import { UserInputNode, UserInputNodeImpl } from './nodes/UserInputNode';

export type NodeResults = Map<string, Record<PortId, DataValue>>;

export type ProcessEvents = {
  onNodeStart?: (node: ChartNode, inputs: Record<PortId, DataValue>) => void;
  onNodeFinish?: (node: ChartNode, result: Record<PortId, DataValue>) => void;
  onNodeError?: (node: ChartNode, error: Error) => void;
  onNodeExcluded?: (node: ChartNode) => void;
  onUserInput?: (
    userInputNodes: UserInputNode[],
    inputs: Record<PortId, DataValue>[],
  ) => Promise<ArrayDataValue<StringDataValue>[]>;
  onPartialOutputs?: (node: ChartNode, outputs: Record<PortId, DataValue>, index: number) => void;
};

export class GraphProcessor {
  #graph: NodeGraph;
  #nodeInstances: Record<NodeId, NodeImpl<ChartNode>>;
  #connections: Record<NodeId, NodeConnection[]>;
  #definitions: Record<NodeId, { inputs: NodeInputDefinition[]; outputs: NodeOutputDefinition[] }>;

  constructor(graph: NodeGraph) {
    this.#graph = graph;
    this.#nodeInstances = {};
    this.#connections = {};

    // Create node instances and store them in a lookup table
    for (const node of this.#graph.nodes) {
      this.#nodeInstances[node.id] = createNodeInstance(node as Nodes);
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
        inputs: this.#nodeInstances[node.id]!.getInputDefinitions(this.#connections[node.id]!),
        outputs: this.#nodeInstances[node.id]!.getOutputDefinitions(this.#connections[node.id]!),
      };
    }
  }

  #nodeIsReady(node: ChartNode, visitedNodes: Set<unknown>, depth = 0): boolean {
    return this.#allInputsVisited(node, visitedNodes);
  }

  #allInputsVisited(node: ChartNode, visitedNodes: Set<unknown>, depth = 0): boolean {
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

        return visitedNodes.has(connectionToInput.outputNodeId);
      }) || this.#definitions[node.id]!.inputs.length === 0
    );
  }

  async processGraph(context: ProcessContext, events: ProcessEvents = {}): Promise<Record<string, DataValue>> {
    const outputNodes = this.#graph.nodes.filter((node) => this.#definitions[node.id]!.outputs.length === 0);

    const nodeResults: NodeResults = new Map();

    // Process nodes in topological order
    const nodesToProcess = [...this.#graph.nodes];
    const visitedNodes = new Set();

    while (nodesToProcess.length > 0) {
      const readyNodes = nodesToProcess.filter((node) => this.#nodeIsReady(node, visitedNodes));

      if (readyNodes.length === 0) {
        for (const erroredNode of nodesToProcess) {
          events.onNodeError?.(
            erroredNode,
            new Error('There might be a cycle in the graph or an issue with input dependencies.'),
          );
        }
        throw new Error('There might be a cycle in the graph or an issue with input dependencies.');
      }

      const userInputNodes = readyNodes.filter((node) => node.type === 'userInput') as UserInputNode[];
      if (userInputNodes.length > 0 && events.onUserInput) {
        try {
          const validUserInputNodes: UserInputNode[] = [];
          const userInputInputValues: Record<PortId, DataValue>[] = [];

          for (const node of userInputNodes) {
            const inputValues = this.#getInputValuesForNode(node, nodeResults);
            if (this.#excludedDueToControlFlow(node, nodeResults, inputValues, events, visitedNodes)) {
              continue;
            }
            validUserInputNodes.push(node);
            userInputInputValues.push(inputValues);
            events.onNodeStart?.(node, inputValues);
          }

          if (validUserInputNodes.length > 0) {
            const userInputResults = await events.onUserInput(validUserInputNodes, userInputInputValues);
            userInputResults.forEach((result, index) => {
              const node = validUserInputNodes[index]!;
              const outputValues = (this.#nodeInstances[node.id] as UserInputNodeImpl).getOutputValuesFromUserInput(
                userInputInputValues[index]!,
                result,
              );
              nodeResults.set(node.id, outputValues);
              visitedNodes.add(node.id);
              nodesToProcess.splice(nodesToProcess.indexOf(node), 1);
              events.onNodeFinish?.(node, outputValues);
            });
            continue;
          }
        } catch (error) {
          for (const node of userInputNodes) {
            events.onNodeError?.(node, error as Error);
          }
          throw error;
        }
      }

      await Promise.allSettled(
        readyNodes.map(async (node) => {
          await this.#processNode(node as Nodes, nodeResults, context, events, visitedNodes, nodesToProcess);
        }),
      );
    }

    // Collect output values
    const outputValues = outputNodes.reduce((values, node) => {
      values[node.id] = nodeResults.get(node.id);
      return values;
    }, {} as Record<string, any>);

    return outputValues;
  }

  async #processNode(
    node: Nodes,
    nodeResults: NodeResults,
    context: ProcessContext,
    events: ProcessEvents,
    visitedNodes: Set<unknown>,
    nodesToProcess: ChartNode[],
  ) {
    nodesToProcess.splice(nodesToProcess.indexOf(node), 1);

    if (node.isSplitRun) {
      await this.#processSplitRunNode(node, nodeResults, context, events, visitedNodes);
    } else {
      await this.#processNormalNode(node, nodeResults, context, events, visitedNodes);
    }
  }

  async #processSplitRunNode(
    node: ChartNode,
    nodeResults: NodeResults,
    context: ProcessContext,
    events: ProcessEvents,
    visitedNodes: Set<unknown>,
  ) {
    const inputValues = this.#getInputValuesForNode(node, nodeResults);

    if (this.#excludedDueToControlFlow(node, nodeResults, inputValues, events, visitedNodes)) {
      return;
    }

    const splittingAmount = Math.min(
      max(Object.values(inputValues).map((value) => (Array.isArray(value.value) ? value.value.length : 1))) ?? 1,
      node.splitRunMax ?? 10,
    );

    events.onNodeStart?.(node, inputValues);

    try {
      const results = await Promise.all(
        range(0, splittingAmount).map(async (i) => {
          const inputs: Record<PortId, DataValue> = Object.fromEntries(
            Object.entries(inputValues).map(([port, value]): [PortId, DataValue] => {
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
            const output = await this.#processNodeWithInputData(node, context, inputs, i, events.onPartialOutputs);
            return output;
          } catch (error) {
            const errorInstance =
              typeof error === 'object' && error instanceof Error
                ? error
                : new Error(error != null ? error.toString() : 'Unknown error');
            events.onNodeError?.(node, errorInstance);
            throw error;
          }
        }),
      );

      // Combine the parallel results into the final output

      // Turn a Record<PortId, DataValue[]> into a Record<PortId, AnyArrayDataValue>
      const aggregateResults = results.reduce((acc, result) => {
        for (const [portId, value] of Object.entries(result)) {
          acc[portId as PortId] ??= { type: (value.type + '[]') as DataValue['type'], value: [] } as DataValue;
          (acc[portId as PortId] as ArrayDataValue<AnyDataValue>).value.push(value.value);
        }
        return acc;
      }, {} as Record<PortId, DataValue>);

      nodeResults.set(node.id, aggregateResults);
      visitedNodes.add(node.id);
      events.onNodeFinish?.(node, aggregateResults);
    } catch (error) {
      const errorInstance =
        typeof error === 'object' && error instanceof Error
          ? error
          : new Error(error != null ? error.toString() : 'Unknown error');
      events.onNodeError?.(node, errorInstance);
      console.error(error);
      throw error;
    }
  }

  async #processNormalNode(
    node: ChartNode,
    nodeResults: NodeResults,
    context: ProcessContext,
    events: ProcessEvents,
    visitedNodes: Set<unknown>,
  ) {
    const inputValues = this.#getInputValuesForNode(node, nodeResults);

    if (this.#excludedDueToControlFlow(node, nodeResults, inputValues, events, visitedNodes)) {
      return;
    }

    events.onNodeStart?.(node, inputValues);

    try {
      const outputValues = await this.#processNodeWithInputData(node, context, inputValues, 0, events.onPartialOutputs);

      nodeResults.set(node.id, outputValues);
      visitedNodes.add(node.id);
      events.onNodeFinish?.(node, outputValues);
    } catch (error) {
      const errorInstance =
        typeof error === 'object' && error instanceof Error
          ? error
          : new Error(error != null ? error.toString() : 'Unknown error');
      events.onNodeError?.(node, errorInstance);
      throw error;
    }
  }

  async #processNodeWithInputData(
    node: ChartNode,
    context: ProcessContext,
    inputValues: Record<PortId, DataValue>,
    index: number,
    onPartialOutputs?: (node: ChartNode, partialOutputs: Record<PortId, DataValue>, index: number) => void,
  ) {
    return await this.#nodeInstances[node.id]!.process(inputValues, context, (partialOutputs) =>
      onPartialOutputs?.(node, partialOutputs, index),
    );
  }

  #excludedDueToControlFlow(
    node: ChartNode,
    nodeResults: NodeResults,
    inputValues: Record<PortId, DataValue>,
    { onNodeExcluded }: { onNodeExcluded?: (node: ChartNode) => void },
    visitedNodes: Set<unknown>,
  ) {
    const inputValuesList = Object.values(inputValues);
    const inputIsExcludedValue =
      inputValuesList.length > 0 && inputValuesList.some((value) => value?.type === 'control-flow-excluded');

    const inputConnections = this.#connections[node.id]?.filter((conn) => conn.inputNodeId === node.id) ?? [];
    const outputNodes = inputConnections
      .map((conn) => this.#graph.nodes.find((n) => n.id === conn.outputNodeId))
      .filter((n) => n) as ChartNode[];

    const anyOutputIsExcludedValue =
      outputNodes.length > 0 &&
      outputNodes.some((outputNode) => {
        const outputValues = nodeResults.get(outputNode.id) ?? {};
        if (outputValues[ControlFlowExcluded as unknown as PortId]) {
          return true;
        }
        return false;
      });

    const allowedToConsumedExcludedValue = node.type === 'if' || node.type === 'ifElse';

    if ((inputIsExcludedValue || anyOutputIsExcludedValue) && !allowedToConsumedExcludedValue) {
      onNodeExcluded?.(node);
      visitedNodes.add(node.id);
      nodeResults.set(node.id, {
        [ControlFlowExcluded as unknown as PortId]: { type: 'control-flow-excluded', value: undefined },
      });
      return true;
    }

    return false;
  }

  #getInputValuesForNode(node: ChartNode, nodeResults: NodeResults): Record<PortId, DataValue> {
    const connections = this.#connections[node.id];
    return this.#definitions[node.id]!.inputs.reduce((values, input) => {
      if (!connections) {
        return values;
      }
      const connection = connections.find((conn) => conn.inputId === input.id && conn.inputNodeId === node.id);
      if (connection) {
        const outputNode = this.#nodeInstances[connection.outputNodeId]!.chartNode;
        const outputResult = nodeResults.get(outputNode.id)?.[connection.outputId];

        values[input.id] = outputResult;
      }
      return values;
    }, {} as Record<string, any>);
  }
}
