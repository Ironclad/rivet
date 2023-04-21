import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition } from './NodeBase';
import { NodeGraph } from './NodeGraph';
import { NodeImpl } from './NodeImpl';
import { Nodes, createNodeInstance } from './Nodes';

export class GraphProcessor {
  #graph: NodeGraph;
  #nodeInstances: Record<NodeId, NodeImpl<ChartNode<string, unknown>>>;
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
    events: {
      onNodeStart?: (node: ChartNode<string, unknown>, inputs: Record<string, unknown>) => void;
      onNodeFinish?: (node: ChartNode<string, unknown>, result: Record<string, unknown>) => void;
      onNodeError?: (node: ChartNode<string, unknown>, error: Error) => void;
    } = {},
  ): Promise<Record<string, any>> {
    const outputNodes = this.#graph.nodes.filter((node) => this.#definitions[node.id].outputs.length === 0);

    const nodeResults = new Map<string, any>();

    // Process nodes in topological order
    const nodesToProcess = [...this.#graph.nodes];
    const visitedNodes = new Set();

    while (nodesToProcess.length > 0) {
      const readyNodes = nodesToProcess.filter((node) =>
        this.#definitions[node.id].inputs.every((input) => {
          const connections = this.#connections[node.id];
          if (!connections) {
            return false;
          }

          const connectionToInput = connections.find(
            (conn) => conn.inputId === input.id && conn.inputNodeId === node.id,
          );

          if (!input.required && !connectionToInput) {
            return true;
          }

          return connectionToInput ? visitedNodes.has(connectionToInput.outputNodeId) : false;
        }),
      );

      if (readyNodes.length === 0) {
        for (const erroredNode of nodesToProcess) {
          events.onNodeError?.(
            erroredNode,
            new Error('There might be a cycle in the graph or an issue with input dependencies.'),
          );
        }
        throw new Error('There might be a cycle in the graph or an issue with input dependencies.');
      }

      await Promise.all(
        readyNodes.map(async (node) => {
          nodesToProcess.splice(nodesToProcess.indexOf(node), 1);

          const connections = this.#connections[node.id];

          // Get input values for this node
          const inputValues = this.#definitions[node.id].inputs.reduce((values, input) => {
            if (!connections) {
              return values;
            }
            const connection = connections.find((conn) => conn.inputId === input.id && conn.inputNodeId === node.id);
            if (connection) {
              const outputNode = this.#nodeInstances[connection.outputNodeId].chartNode;
              values[input.id] = nodeResults.get(outputNode.id)[connection.outputId];
            }
            return values;
          }, {} as Record<string, any>);

          // Process the node and save its output
          events.onNodeStart?.(node, inputValues);
          const outputValues = await this.#nodeInstances[node.id].process(inputValues);
          nodeResults.set(node.id, outputValues);
          visitedNodes.add(node.id);
          events.onNodeFinish?.(node, outputValues);
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
}
