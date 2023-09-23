import { useRecoilValue } from 'recoil';
import { useStableCallback } from './useStableCallback.js';
import { selectedNodesState } from '../state/graphBuilder.js';
import { connectionsState, nodesByIdState } from '../state/graph.js';
import { max, min, uniqBy } from 'lodash-es';
import {
  type ChartNode,
  GraphInputNodeImpl,
  GraphOutputNodeImpl,
  type NodeConnection,
  type NodeId,
  type PortId,
  type ScalarOrArrayDataType,
  emptyNodeGraph,
  globalRivetNodeRegistry,
} from '@ironclad/rivet-core';
import { projectState } from '../state/savedGraphs.js';
import { isNotNull } from '../utils/genericUtilFunctions.js';
import { nanoid } from 'nanoid/non-secure';
import { useLoadGraph } from './useLoadGraph.js';

export function useFactorIntoSubgraph() {
  const project = useRecoilValue(projectState);
  const selectedNodeIds = useRecoilValue(selectedNodesState);
  const connections = useRecoilValue(connectionsState);
  const loadGraph = useLoadGraph();
  const nodesById = useRecoilValue(nodesByIdState);

  return useStableCallback(() => {
    if (selectedNodeIds.length === 0) {
      return;
    }

    const selectedNodes = selectedNodeIds.map((id) => nodesById[id]).filter(isNotNull);

    // Get all unique inputs from the nodes
    const allInputs = selectedNodeIds
      .flatMap((node) => {
        const nodeConnections = connections.filter(
          (connection) => connection.inputNodeId === node && !selectedNodeIds.includes(connection.outputNodeId),
        );
        return nodeConnections;
      })
      .map((connection) => {
        const id = `${connection.outputNodeId}/${connection.outputId}`;
        const inputNode = nodesById[connection.inputNodeId];
        const outputNode = nodesById[connection.outputNodeId];

        if (!outputNode || !inputNode) {
          return undefined;
        }

        const inputDefs = globalRivetNodeRegistry
          .createDynamicImpl(inputNode)
          .getInputDefinitions(connections, nodesById, project);

        if (!inputDefs.find((d) => d.id === connection.inputId)) {
          return undefined;
        }

        const outputDefs = globalRivetNodeRegistry
          .createDynamicImpl(outputNode)
          .getOutputDefinitions(connections, nodesById, project);

        const outputDef = outputDefs.find((d) => d.id === connection.outputId);

        if (!outputDef) {
          return undefined;
        }

        return {
          id,
          outputNode,
          inputId: connection.inputId,
          input: connection.inputId,
          type: outputDef.dataType,
        };
      })
      .filter(isNotNull);

    const uniqueInputs = uniqBy(allInputs, 'id');

    const inputNames = new Set<string>();
    const namedUniqueInputs = uniqueInputs.map((input) => {
      let name = input.inputId as string;
      while (inputNames.has(name)) {
        name += '_';
      }
      inputNames.add(name);

      return {
        ...input,
        name,
      };
    });

    // Get all unique outputs from the nodes
    const allOutputs = selectedNodeIds
      .flatMap((node) => {
        const nodeConnections = connections.filter(
          (connection) => connection.outputNodeId === node && !selectedNodeIds.includes(connection.inputNodeId),
        );
        return nodeConnections;
      })
      .map((connection) => {
        const id = `${connection.outputNodeId}/${connection.outputId}`;
        const inputNode = nodesById[connection.inputNodeId];
        const outputNode = nodesById[connection.outputNodeId];

        if (!outputNode || !inputNode) {
          return undefined;
        }

        const outputDefs = globalRivetNodeRegistry
          .createDynamicImpl(outputNode)
          .getOutputDefinitions(connections, nodesById, project);
        const outputDef = outputDefs.find((d) => d.id === connection.outputId);

        if (!outputDef) {
          return undefined;
        }

        const inputDefs = globalRivetNodeRegistry
          .createDynamicImpl(inputNode)
          .getInputDefinitions(connections, nodesById, project);
        const inputDef = inputDefs.find((d) => d.id === connection.inputId);

        if (!inputDef) {
          return undefined;
        }

        return {
          id,
          inputNode,
          outputId: connection.outputId,
          output: connection.outputId,
          type: outputDef.dataType,
        };
      })
      .filter(isNotNull);

    const uniqueOutputs = uniqBy(allOutputs, 'id');

    const outputNames = new Set<string>();
    const namedUniqueOutputs = uniqueOutputs.map((output) => {
      let name = output.outputId as string;
      while (outputNames.has(name)) {
        name += '_';
      }
      outputNames.add(name);

      return {
        ...output,
        name,
      };
    });

    // Copy to a new graph
    const newGraph = emptyNodeGraph();

    // Copy nodes to new graph
    const nodeIdLookup: Record<NodeId, NodeId> = {};
    const copies = selectedNodes.map((node) => {
      const copy: ChartNode = { ...node, id: nanoid() as NodeId };
      nodeIdLookup[node.id] = copy.id;
      return copy;
    });
    for (const copy of copies) {
      newGraph.nodes.push(copy);
    }

    // Copy connections to new graph
    for (const connection of connections.filter(
      (c) => selectedNodeIds.includes(c.inputNodeId) && selectedNodeIds.includes(c.outputNodeId),
    )) {
      const newConnection: NodeConnection = {
        ...connection,
        inputNodeId: nodeIdLookup[connection.inputNodeId]!,
        outputNodeId: nodeIdLookup[connection.outputNodeId]!,
      };
      newGraph.connections.push(newConnection);
    }

    // Create graph input nodes
    const inputNodeX = min(selectedNodes.map((n) => n.visualData.x))! - 500;
    const inputNodeStartY = min(selectedNodes.map((n) => n.visualData.y))!;

    const inputNodeLookup: Record<string, NodeId> = {};
    for (const [input, i] of namedUniqueInputs.map((input, i) => [input, i] as const)) {
      const node = GraphInputNodeImpl.create();
      node.visualData = {
        ...node.visualData,
        x: inputNodeX,
        y: inputNodeStartY + i * 200,
      };
      node.data = {
        dataType: input.type as ScalarOrArrayDataType,
        id: input.name,
      };

      newGraph.nodes.push(node);
      inputNodeLookup[input.id] = node.id;
    }

    const createdInputConnections = new Set<string>();

    // Create connections to new graph input nodes
    for (const connection of connections.filter(
      (c) => selectedNodeIds.includes(c.inputNodeId) && !selectedNodeIds.includes(c.outputNodeId),
    )) {
      const id = `${connection.outputNodeId}/${connection.outputId}`;

      if (createdInputConnections.has(id)) {
        continue;
      }

      const inputNode = inputNodeLookup[id]!;

      const newConnection: NodeConnection = {
        inputId: connection.inputId,
        inputNodeId: nodeIdLookup[connection.inputNodeId]!,
        outputNodeId: inputNode,
        outputId: 'data' as PortId,
      };
      newGraph.connections.push(newConnection);
      createdInputConnections.add(id);
    }

    // Create graph output nodes
    const outputNodeX = max(selectedNodes.map((n) => n.visualData.x))! + 500;
    const outputNodeStartY = min(selectedNodes.map((n) => n.visualData.y))!;

    const outputNodeLookup: Record<string, NodeId> = {};
    for (const [output, i] of namedUniqueOutputs.map((output, i) => [output, i] as const)) {
      const node = GraphOutputNodeImpl.create();
      node.visualData = {
        ...node.visualData,
        x: outputNodeX,
        y: outputNodeStartY + i * 200,
      };
      node.data = {
        dataType: output.type as ScalarOrArrayDataType,
        id: output.name,
      };

      newGraph.nodes.push(node);
      outputNodeLookup[output.id] = node.id;
    }

    const createdOutputConnections = new Set<string>();

    // Create connections to new graph output nodes
    for (const connection of connections.filter(
      (c) => !selectedNodeIds.includes(c.inputNodeId) && selectedNodeIds.includes(c.outputNodeId),
    )) {
      const id = `${connection.outputNodeId}/${connection.outputId}`;

      if (createdOutputConnections.has(id)) {
        continue;
      }

      const newConnection: NodeConnection = {
        inputId: 'value' as PortId,
        inputNodeId: outputNodeLookup[id]!,
        outputNodeId: nodeIdLookup[connection.outputNodeId]!,
        outputId: connection.outputId,
      };
      newGraph.connections.push(newConnection);

      createdOutputConnections.add(id);
    }

    loadGraph(newGraph);
  });
}
