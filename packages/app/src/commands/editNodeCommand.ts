import { useAtomValue, useSetAtom } from 'jotai';
import { type GraphCommandState, commandHistoryStackStatePerGraph, useCommand } from './Command';
import {
  type NodeId,
  type NodeConnection,
  type ChartNode,
  globalRivetNodeRegistry,
  type Project,
} from '@ironclad/rivet-core';
import { nodesState, connectionsState } from '../state/graph';
import { produce } from 'immer';
import { referencedProjectsState } from '../state/savedGraphs';

const MERGE_WINDOW_MS = 5000; // 5 seconds in milliseconds

export function useEditNodeCommand() {
  const setNodes = useSetAtom(nodesState);
  const setConnections = useSetAtom(connectionsState);
  const setCommandHistories = useSetAtom(commandHistoryStackStatePerGraph);
  const referencedProjects = useAtomValue(referencedProjectsState);

  const findBrokenConnections = (
    nodeId: NodeId,
    newNode: Partial<ChartNode>,
    nodes: ChartNode[],
    connections: NodeConnection[],
    project: Project,
  ) => {
    const updatedNodes = produce(nodes, (draft) => {
      const index = draft.findIndex((n) => n.id === nodeId);
      draft[index] = {
        ...draft[index],
        ...newNode,
      } as ChartNode;
    });

    const connectionsForNode = connections.filter(
      (conn) => conn.inputNodeId === nodeId || conn.outputNodeId === nodeId,
    );

    const nodesById = Object.fromEntries(updatedNodes.map((n) => [n.id, n]));
    const updatedNode = nodesById[nodeId]!;
    const instance = globalRivetNodeRegistry.createDynamicImpl(updatedNode);

    const inputDefs = instance.getInputDefinitionsIncludingBuiltIn(
      connectionsForNode,
      nodesById,
      project,
      referencedProjects,
    );
    const outputDefs = instance.getOutputDefinitions(connectionsForNode, nodesById, project, referencedProjects);

    return connectionsForNode.filter((connection) => {
      if (connection.inputNodeId === nodeId) {
        return !inputDefs.find((def) => def.id === connection.inputId);
      } else {
        return !outputDefs.find((def) => def.id === connection.outputId);
      }
    });
  };

  const updateNodeAndConnections = (
    nodeId: NodeId,
    newNode: Partial<ChartNode>,
    currentState: GraphCommandState,
    existingBrokenConnections: NodeConnection[] = [],
  ) => {
    // Find any new broken connections
    const newBrokenConnections = findBrokenConnections(
      nodeId,
      newNode,
      currentState.nodes,
      currentState.connections.filter((conn) => !existingBrokenConnections.includes(conn)),
      currentState.project,
    );

    // Update the node
    setNodes(
      produce(currentState.nodes, (draft) => {
        const index = draft.findIndex((n) => n.id === nodeId);
        draft[index] = {
          ...draft[index],
          ...structuredClone(newNode),
        } as ChartNode;
      }),
    );

    // Remove broken connections
    if (newBrokenConnections.length > 0) {
      setConnections(currentState.connections.filter((conn) => !newBrokenConnections.includes(conn)));
    }

    return newBrokenConnections;
  };

  return useCommand<
    {
      nodeId: NodeId;
      newNode: Partial<ChartNode>;
    },
    {
      previousNode: Partial<ChartNode>;
      brokenConnections: NodeConnection[];
    }
  >({
    type: 'editNode',
    apply(params, appliedData, currentState) {
      const nodeToEdit = currentState.nodes.find((node) => node.id === params.nodeId);

      if (!nodeToEdit) {
        throw new Error(`Node with id ${params.nodeId} not found`);
      }

      // Check if we should merge with the previous edit
      const lastCommand = currentState.commandHistoryStack.at(-1);
      const withinMergeWindow = lastCommand && Date.now() - lastCommand.timestamp <= MERGE_WINDOW_MS;
      const shouldMerge =
        !appliedData &&
        withinMergeWindow &&
        lastCommand.command.type === 'editNode' &&
        lastCommand.data.nodeId === params.nodeId;

      if (shouldMerge) {
        // Remove the previous command
        setCommandHistories((stacks) => {
          if (!currentState.graphId) {
            return stacks;
          }

          const stack = stacks[currentState.graphId] ?? [];
          return {
            ...stacks,
            [currentState.graphId]: stack.slice(0, -1),
          };
        });

        const commandToMergeWith = lastCommand;

        const newBrokenConnections = updateNodeAndConnections(
          params.nodeId,
          params.newNode,
          currentState,
          commandToMergeWith.appliedData.brokenConnections,
        );

        return {
          previousNode: commandToMergeWith.appliedData.previousNode,
          brokenConnections: [...commandToMergeWith.appliedData.brokenConnections, ...newBrokenConnections],
        };
      }

      // Normal case - not merging
      const previousNode = structuredClone(nodeToEdit);
      const brokenConnections = updateNodeAndConnections(params.nodeId, params.newNode, currentState);

      return {
        previousNode,
        brokenConnections,
      };
    },
    undo({ nodeId }, appliedData, currentState) {
      // Restore the node's previous properties
      setNodes(
        produce(currentState.nodes, (draft) => {
          const index = draft.findIndex((n) => n.id === nodeId);
          draft[index] = {
            ...draft[index],
            ...structuredClone(appliedData.previousNode),
          } as ChartNode;
        }),
      );

      // Restore all broken connections
      if (appliedData.brokenConnections.length > 0) {
        setConnections([...currentState.connections, ...appliedData.brokenConnections]);
      }
    },
  });
}
