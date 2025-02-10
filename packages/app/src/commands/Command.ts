import { type Project, type ChartNode, type NodeConnection } from '@ironclad/rivet-core';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { connectionsState, nodesState } from '../state/graph';
import { useStableCallback } from '../hooks/useStableCallback';
import { projectState } from '../state/savedGraphs';

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
};

export const commandHistoryStackState = atom<CommandData<any, any>[]>([]);

export const redoStackState = atom<CommandData<any, any>[]>([]);

function useGraphCommandState(): GraphCommandState {
  const nodes = useAtomValue(nodesState);
  const connections = useAtomValue(connectionsState);
  const project = useAtomValue(projectState);
  const commandHistoryStack = useAtomValue(commandHistoryStackState);

  return {
    nodes,
    connections,
    project,
    commandHistoryStack,
  };
}

export function useCommand<T, U>(command: Command<T, U>) {
  const setCommandHistoryStack = useSetAtom(commandHistoryStackState);
  const setRedoStack = useSetAtom(redoStackState);

  const currentState = useGraphCommandState();

  return useStableCallback((data: T) => {
    const appliedData = command.apply(data, undefined, currentState);

    setCommandHistoryStack((stack) => [
      ...stack,
      {
        command,
        data,
        appliedData,
        timestamp: Date.now(),
      },
    ]);

    setRedoStack([]);

    return appliedData;
  });
}

export function useUndo() {
  const setCommandHistoryStack = useSetAtom(commandHistoryStackState);
  const setRedoStack = useSetAtom(redoStackState);

  const currentState = useGraphCommandState();

  return () => {
    setCommandHistoryStack((stack) => {
      const lastCommand = stack[stack.length - 1];

      if (!lastCommand) {
        return stack;
      }

      lastCommand.command.undo(lastCommand.data, lastCommand.appliedData, currentState);

      setRedoStack((redoStack) => [...redoStack, lastCommand]);

      return stack.slice(0, -1);
    });
  };
}

export function useRedo() {
  const setCommandHistoryStack = useSetAtom(commandHistoryStackState);
  const setRedoStack = useSetAtom(redoStackState);

  const currentState = useGraphCommandState();

  return () => {
    setRedoStack((stack) => {
      const lastCommand = stack[stack.length - 1];
      if (!lastCommand) {
        return stack;
      }

      lastCommand.command.apply(lastCommand.data, lastCommand.appliedData, currentState);

      setCommandHistoryStack((commandHistoryStack) => [
        ...commandHistoryStack,
        {
          command: lastCommand.command,
          data: lastCommand.data,
          appliedData: lastCommand.appliedData,
          timestamp: Date.now(),
        },
      ]);

      return stack.slice(0, -1);
    });
  };
}
