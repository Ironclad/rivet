import {
  type Project,
  type ChartNode,
  type NodeConnection,
  type GraphId,
  type NodeId,
  type ProjectId,
} from '@ironclad/rivet-core';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { connectionsState, graphMetadataState, nodesState } from '../state/graph';
import { useStableCallback } from '../hooks/useStableCallback';
import { projectState, referencedProjectsState } from '../state/savedGraphs';
import { editingNodeState } from '../state/graphBuilder';

export interface Command<T, U> {
  type: string;

  apply(data: T, appliedData: U | undefined, currentState: GraphCommandState): U;

  undo(data: T, appliedData: U, currentState: GraphCommandState): void;
}

export type CommandData<T, U> = {
  command: Command<T, U>;
  data: T;
  appliedData: U;
  timestamp: number;
};

/** The current state of the graph. Any "current" state a command needs should be added here. */
export type GraphCommandState = {
  nodes: ChartNode[];
  connections: NodeConnection[];
  project: Project;
  commandHistoryStack: CommandData<any, any>[];
  graphId: GraphId | undefined;
  editingNodeId: NodeId | null;
  referencedProjects: Record<ProjectId, Project>;
};

export const commandHistoryStackStatePerGraph = atom<Record<GraphId, CommandData<any, any>[]>>({});
export const redoStackStatePerGraph = atom<Record<GraphId, CommandData<any, any>[]>>({});

function useGraphCommandState(): GraphCommandState {
  const graphId = useAtomValue(graphMetadataState)?.id;
  const nodes = useAtomValue(nodesState);
  const connections = useAtomValue(connectionsState);
  const project = useAtomValue(projectState);
  const commandHistoryStacks = useAtomValue(commandHistoryStackStatePerGraph);
  const commandHistoryStack = graphId ? commandHistoryStacks[graphId] ?? [] : [];
  const editingNodeId = useAtomValue(editingNodeState);
  const referencedProjects = useAtomValue(referencedProjectsState);

  return {
    nodes,
    connections,
    project,
    commandHistoryStack,
    graphId,
    editingNodeId,
    referencedProjects,
  };
}

export function useCommand<T, U>(command: Command<T, U>) {
  const graphId = useAtomValue(graphMetadataState)?.id;
  const setCommandHistoryStacks = useSetAtom(commandHistoryStackStatePerGraph);
  const setRedoStacks = useSetAtom(redoStackStatePerGraph);

  const currentState = useGraphCommandState();

  return useStableCallback((data: T) => {
    const appliedData = command.apply(data, undefined, currentState);

    setCommandHistoryStacks((stacks) => {
      if (!graphId) {
        return stacks;
      }

      const stack = stacks[graphId] ?? [];

      return {
        ...stacks,
        [graphId]: [
          ...stack,
          {
            command,
            data,
            appliedData,
            timestamp: Date.now(),
          },
        ],
      };
    });

    setRedoStacks((redoStacks) => {
      if (!graphId) {
        return redoStacks;
      }

      return {
        ...redoStacks,
        [graphId]: [],
      };
    });

    return appliedData;
  });
}

export function useUndo() {
  const graphId = useAtomValue(graphMetadataState)?.id;
  const setCommandHistoryStacks = useSetAtom(commandHistoryStackStatePerGraph);
  const setRedoStacks = useSetAtom(redoStackStatePerGraph);

  const currentState = useGraphCommandState();

  return () => {
    setCommandHistoryStacks((stacks) => {
      if (!graphId) {
        return stacks;
      }

      const stack = stacks[graphId] ?? [];

      const lastCommand = stack.at(-1);

      if (!lastCommand) {
        return stacks;
      }

      lastCommand.command.undo(lastCommand.data, lastCommand.appliedData, currentState);

      setRedoStacks((redoStacks) => {
        const redoStack = redoStacks[graphId] ?? [];

        return {
          ...redoStacks,
          [graphId]: [...redoStack, lastCommand],
        };
      });

      return {
        ...stacks,
        [graphId]: stack.slice(0, -1),
      };
    });
  };
}

export function useRedo() {
  const graphId = useAtomValue(graphMetadataState)?.id;
  const setCommandHistoryStacks = useSetAtom(commandHistoryStackStatePerGraph);
  const setRedoStacks = useSetAtom(redoStackStatePerGraph);

  const currentState = useGraphCommandState();

  return () => {
    setRedoStacks((stacks) => {
      if (!graphId) {
        return stacks;
      }

      const stack = stacks[graphId] ?? [];

      const lastCommand = stack.at(-1);
      if (!lastCommand) {
        return stacks;
      }

      lastCommand.command.apply(lastCommand.data, lastCommand.appliedData, currentState);

      setCommandHistoryStacks((commandHistoryStacks) => {
        const commandHistoryStack = commandHistoryStacks[graphId] ?? [];

        return {
          ...commandHistoryStacks,
          [graphId]: [...commandHistoryStack, lastCommand],
        };
      });

      return {
        ...stacks,
        [graphId]: stack.slice(0, -1),
      };
    });
  };
}
