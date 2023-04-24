import { uniqBy } from 'lodash-es';
import { ControlFlowExcluded } from '../utils/symbols';
import { DataValue, ArrayDataValue, AnyDataValue, StringDataValue, expectType, ScalarDataValue } from './DataValue';
import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from './NodeBase';
import { NodeGraph } from './NodeGraph';
import { NodeImpl, ProcessContext } from './NodeImpl';
import { Nodes, createNodeInstance } from './Nodes';
import { SplitRunNode } from './nodes/SplitRunNode';
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
  onPartialOutputs?: (node: ChartNode, outputs: Record<PortId, DataValue>) => void;
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
    if (depth > 100) {
      throw new Error('Maximum recursion depth exceeded');
    }

    if ((node as Nodes).type === 'splitRun') {
      const nextNodes = this.#getSplitRunNextNodes(node as SplitRunNode);
      return (
        nextNodes.length === 0 || nextNodes.every((nextNode) => this.#nodeIsReady(nextNode, visitedNodes, depth + 1))
      );
    }
    return this.#allInputsVisited(node, visitedNodes);
  }

  #canRunNormally(node: ChartNode): boolean {
    const connections = this.#connections[node.id];
    const inputs = this.#definitions[node.id]!.inputs;
    return (
      inputs.length === 0 ||
      inputs.every((input) => {
        const connectionToInput = connections?.find(
          (conn) => conn.inputId === input.id && conn.inputNodeId === node.id,
        );

        if (!connectionToInput) {
          return true;
        }

        const outputNode = this.#graph.nodes.find((n) => n.id === connectionToInput?.outputNodeId);
        return outputNode?.type !== 'splitRun';
      })
    );
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

        const outputNode = this.#graph.nodes.find((n) => n.id === connectionToInput?.outputNodeId);
        if (outputNode?.type === 'splitRun') {
          return this.#allInputsVisited(outputNode, visitedNodes, depth + 1);
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
      const readyNodes = nodesToProcess
        .filter((node) => this.#nodeIsReady(node, visitedNodes))
        .filter((node) => this.#canRunNormally(node));

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

    if (node.type === 'splitRun') {
      await this.#processSplitRunNode(node, nodeResults, context, events, visitedNodes, nodesToProcess);
    } else {
      await this.#processNormalNode(node, nodeResults, context, events, visitedNodes);
    }
  }

  async #processSplitRunNode(
    node: SplitRunNode,
    nodeResults: NodeResults,
    context: ProcessContext,
    events: ProcessEvents,
    visitedNodes: Set<unknown>,
    nodesToProcess: ChartNode[],
  ) {
    const inputDataType = this.#getInputValuesForNode(node, nodeResults)['input' as PortId]!
      .type as ArrayDataValue<ScalarDataValue>['type'];
    const inputData = expectType(this.#getInputValuesForNode(node, nodeResults)['input' as PortId], 'any[]').slice(
      0,
      node.data.max ?? 10,
    );

    if (inputData.length <= 0) {
      throw new Error('Input data for SplitRunNode must be a non-empty array');
    }

    const nextNodes = this.#getSplitRunNextNodes(node);

    try {
      const parallelResults = await Promise.all(
        nextNodes.map(async (nextNode) => {
          nodesToProcess.splice(nodesToProcess.indexOf(nextNode), 1);
          const results: Record<NodeId, Record<PortId, DataValue>[]> = {};

          const connectionToNextNode = this.#connections[node.id]?.find((conn) => conn.inputNodeId === nextNode.id);
          if (!connectionToNextNode) {
            throw new Error('SplitRunNode must have a connection to all of its next nodes');
          }
          const inputPort = connectionToNextNode.inputId;

          await Promise.all(
            inputData.map(async (inputValue) => {
              // Update the input data for the next node with the current input value from the array
              const nextNodeInputData: Record<PortId, DataValue> = {
                ...this.#getInputValuesForNode(nextNode, nodeResults),
                [inputPort]: {
                  type: inputDataType.slice(0, -2),
                  value: inputValue,
                },
              };

              try {
                const nextNodeOutput = await this.#processNodeWithInputData(nextNode, context, nextNodeInputData);
                results[nextNode.id] ??= [];
                results[nextNode.id]!.push(nextNodeOutput);
              } catch (error) {
                const errorInstance =
                  typeof error === 'object' && error instanceof Error
                    ? error
                    : new Error(error != null ? error.toString() : 'Unknown error');
                events.onNodeError?.(nextNode, errorInstance);
                throw error;
              }
            }),
          );
          return results;
        }),
      );

      const mergedResults = parallelResults.reduce((acc, result) => {
        return {
          ...acc,
          ...result,
        };
      }, {} as Record<NodeId, Record<PortId, DataValue>[]>);

      // Combine the parallel results into the final output
      for (const [nodeId, allResults] of Object.entries(mergedResults)) {
        const node = this.#graph.nodes.find((node) => node.id === nodeId)!;

        // Turn a Record<PortId, DataValue[]> into a Record<PortId, AnyArrayDataValue>
        const aggregateResults = allResults.reduce((acc, result) => {
          for (const [portId, value] of Object.entries(result)) {
            acc[portId as PortId] ??= { type: (value.type + '[]') as DataValue['type'], value: [] } as DataValue;
            (acc[portId as PortId] as ArrayDataValue<AnyDataValue>).value.push(value.value);
          }
          return acc;
        }, {} as Record<PortId, DataValue>);

        nodeResults.set(node.id, aggregateResults);
        visitedNodes.add(node.id);
        events.onNodeFinish?.(node, aggregateResults);
      }

      nodeResults.set(node.id, {} as Record<PortId, DataValue>);
      visitedNodes.add(node.id);
      events.onNodeFinish?.(node, {} as Record<PortId, DataValue>);
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

  #getSplitRunNextNodes(node: SplitRunNode) {
    const outputConnections = this.#connections[node.id]!.filter((conn) => conn.outputNodeId === node.id);
    const nextNodes = uniqBy(
      outputConnections.map((conn) => this.#graph.nodes.find((node) => node.id === conn.inputNodeId)!),
      (n) => n.id,
    );
    return nextNodes;
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

    // Process the node and save its output
    events.onNodeStart?.(node, inputValues);

    try {
      const outputValues = await this.#processNodeWithInputData(node, context, inputValues, events.onPartialOutputs);

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
    onPartialOutputs?: (node: ChartNode, partialOutputs: Record<PortId, DataValue>) => void,
  ) {
    return await this.#nodeInstances[node.id]!.process(inputValues, context, (partialOutputs) =>
      onPartialOutputs?.(node, partialOutputs),
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

    if (inputIsExcludedValue || anyOutputIsExcludedValue) {
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
