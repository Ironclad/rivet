import { ChartNode, NodeConnection, NodeId } from './NodeBase';
import { NodeGraph } from './NodeGraph';
import { NodeImpl } from './NodeImpl';
import { Nodes, createNodeInstance } from './Nodes';

export class GraphProcessor {
  #graph: NodeGraph;
  #nodeInstances: Record<NodeId, NodeImpl<ChartNode<string, unknown>>>;
  #connections: Record<NodeId, NodeConnection[]>;

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
  }

  processGraph(): Record<string, any> {
    const inputNodes = this.#graph.nodes.filter((node) => node.inputDefinitions.length === 0);
    const outputNodes = this.#graph.nodes.filter((node) => node.outputDefinitions.length === 0);

    const nodeResults = new Map<string, any>();

    // Initialize input nodes with their data
    for (const node of inputNodes) {
      nodeResults.set(node.id, this.#nodeInstances[node.id].process({}));
    }

    // Process nodes in topological order
    const nodesToProcess = this.#graph.nodes.filter((node) => !inputNodes.includes(node));
    const visitedNodes = new Set();

    while (nodesToProcess.length > 0) {
      const node = nodesToProcess.shift()!;

      // Check if all inputs are available
      const inputsAvailable = node.inputDefinitions.every((input) => {
        const connections = this.#connections[node.id];
        if (!connections) {
          return false;
        }
        const connection = connections.find((conn) => conn.inputId === input.id);
        return connection ? visitedNodes.has(connection.outputId) : false;
      });

      if (!inputsAvailable) {
        // Put node back at the end of the queue and try again later
        nodesToProcess.push(node);
        continue;
      }

      // Get input values for this node
      const inputValues = node.inputDefinitions.reduce((values, input) => {
        const connections = this.#connections[node.id];
        if (!connections) {
          return values;
        }
        const connection = connections.find((conn) => conn.inputId === input.id);
        if (connection) {
          const outputNode = this.#nodeInstances[connection.outputNodeId].chartNode;
          values[input.id] = nodeResults.get(outputNode.id)[connection.outputId];
        }
        return values;
      }, {} as Record<string, any>);

      // Process the node and save its output
      const outputValues = this.#nodeInstances[node.id].process(inputValues);
      nodeResults.set(node.id, outputValues);
      visitedNodes.add(node.id);

      // Add dependent nodes to the list of nodes to process
      for (const output of node.outputDefinitions) {
        const connections = this.#connections[node.id];
        if (!connections) {
          continue;
        }
        for (const connection of connections.filter((conn) => conn.outputId === output.id)) {
          const dependentNode = this.#nodeInstances[connection.inputNodeId].chartNode;
          if (!nodesToProcess.includes(dependentNode)) {
            nodesToProcess.push(dependentNode);
          }
        }
      }
    }

    // Collect output values
    const outputValues = outputNodes.reduce((values, node) => {
      values[node.id] = nodeResults.get(node.id);
      return values;
    }, {} as Record<string, any>);

    return outputValues;
  }
}
