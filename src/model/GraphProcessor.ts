import { DataValue, StringArrayDataValue, StringDataValue } from './DataValue';
import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from './NodeBase';
import { NodeGraph } from './NodeGraph';
import { NodeImpl, ProcessContext } from './NodeImpl';
import { Nodes, createNodeInstance } from './Nodes';
import { UserInputNode, UserInputNodeImpl } from './nodes/UserInputNode';

const ControlFlowExcludedSymbol = Symbol('ControlFlowExcluded');

export type NodeResults = Map<string, Record<PortId, DataValue>>;

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
      this.#connections[conn.inputNodeId].push(conn);
      this.#connections[conn.outputNodeId].push(conn);
    }

    // Store input and output definitions in a lookup table
    this.#definitions = {};
    for (const node of this.#graph.nodes) {
      this.#definitions[node.id] = {
        inputs: this.#nodeInstances[node.id].getInputDefinitions(this.#connections[node.id]),
        outputs: this.#nodeInstances[node.id].getOutputDefinitions(this.#connections[node.id]),
      };
    }
  }

  async processGraph(
    context: ProcessContext,
    events: {
      onNodeStart?: (node: ChartNode, inputs: Record<string, DataValue>) => void;
      onNodeFinish?: (node: ChartNode, result: Record<string, DataValue>) => void;
      onNodeError?: (node: ChartNode, error: Error) => void;
      onNodeExcluded?: (node: ChartNode) => void;
      onUserInput?: (
        userInputNodes: UserInputNode[],
        inputs: Record<PortId, DataValue>[],
      ) => Promise<StringArrayDataValue[]>;
    } = {},
  ): Promise<Record<string, any>> {
    const outputNodes = this.#graph.nodes.filter((node) => this.#definitions[node.id].outputs.length === 0);

    const nodeResults: NodeResults = new Map();

    // Process nodes in topological order
    const nodesToProcess = [...this.#graph.nodes];
    const visitedNodes = new Set();

    while (nodesToProcess.length > 0) {
      const readyNodes = nodesToProcess.filter((node) => {
        const connections = this.#connections[node.id];
        return this.#definitions[node.id].inputs.every((input) => {
          const connectionToInput = connections?.find(
            (conn) => conn.inputId === input.id && conn.inputNodeId === node.id,
          );

          if (!input.required && !connectionToInput) {
            return true;
          }

          return connectionToInput ? visitedNodes.has(connectionToInput.outputNodeId) : false;
        });
      });

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
            const inputValues = this.#getInputValuesForNode(node, nodeResults, events);
            if (this.#excludedDueToControlFlow(node, nodeResults, inputValues, events, visitedNodes)) {
              continue;
            }
            validUserInputNodes.push(node);
            userInputInputValues.push(inputValues);
            events.onNodeStart?.(node, inputValues);
          }

          const userInputResults = await events.onUserInput(validUserInputNodes, userInputInputValues);
          userInputResults.forEach((result, index) => {
            const node = validUserInputNodes[index];
            const outputValues = (this.#nodeInstances[node.id] as UserInputNodeImpl).getOutputValuesFromUserInput(
              userInputInputValues[index],
              result,
            );
            nodeResults.set(node.id, outputValues);
            visitedNodes.add(node.id);
            nodesToProcess.splice(nodesToProcess.indexOf(node), 1);
            events.onNodeFinish?.(node, outputValues);
          });
          continue;
        } catch (error) {
          for (const node of userInputNodes) {
            events.onNodeError?.(node, error as Error);
          }
          throw error;
        }
      }

      await Promise.allSettled(
        readyNodes.map(async (node) => {
          nodesToProcess.splice(nodesToProcess.indexOf(node), 1);

          const inputValues = this.#getInputValuesForNode(node, nodeResults, events);

          if (this.#excludedDueToControlFlow(node, nodeResults, inputValues, events, visitedNodes)) {
            return;
          }

          // Process the node and save its output
          events.onNodeStart?.(node, inputValues);

          try {
            const outputValues = await this.#nodeInstances[node.id].process(inputValues, context);

            nodeResults.set(node.id, outputValues);
            visitedNodes.add(node.id);
            events.onNodeFinish?.(node, outputValues);
          } catch (error) {
            events.onNodeError?.(node, error as Error);
            throw error;
          }
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

  #excludedDueToControlFlow(
    node: ChartNode,
    nodeResults: NodeResults,
    inputValues: Record<PortId, DataValue>,
    { onNodeExcluded }: { onNodeExcluded?: (node: ChartNode) => void },
    visitedNodes: Set<unknown>,
  ) {
    // Check if the node is excluded due to control flow
    if (
      Object.values(inputValues).some((value) => value?.type === 'control-flow-excluded') ||
      nodeResults.get(node.id)?.[ControlFlowExcludedSymbol as unknown as PortId]
    ) {
      onNodeExcluded?.(node);
      visitedNodes.add(node.id);
      nodeResults.set(node.id, {
        [ControlFlowExcludedSymbol as unknown as PortId]: { type: 'control-flow-excluded', value: undefined },
      });
      return true;
    }

    return false;
  }

  #getInputValuesForNode(
    node: ChartNode,
    nodeResults: NodeResults,
    { onNodeExcluded }: { onNodeExcluded?: (node: ChartNode) => void },
  ): Record<PortId, DataValue> {
    const connections = this.#connections[node.id];
    return this.#definitions[node.id].inputs.reduce((values, input) => {
      if (!connections) {
        return values;
      }
      const connection = connections.find((conn) => conn.inputId === input.id && conn.inputNodeId === node.id);
      if (connection) {
        const outputNode = this.#nodeInstances[connection.outputNodeId].chartNode;
        const outputResult = nodeResults.get(outputNode.id)?.[connection.outputId];

        if (outputResult?.type === 'control-flow-excluded') {
          onNodeExcluded?.(node);
          return values;
        }

        values[input.id] = outputResult;
      }
      return values;
    }, {} as Record<string, any>);
  }
}
