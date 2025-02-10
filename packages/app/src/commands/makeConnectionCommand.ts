import { type NodeConnection, type NodeId, type PortId } from '@ironclad/rivet-core';
import { useCommand } from './Command';
import { useSetAtom } from 'jotai';
import { connectionsState } from '../state/graph';

export function useMakeConnectionCommand() {
  const setConnections = useSetAtom(connectionsState);

  return useCommand<
    {
      outputNodeId: NodeId;
      outputId: PortId;
      inputNodeId: NodeId;
      inputId: PortId;
    },
    {
      newConnection: NodeConnection;
      previousConnectionToInput: NodeConnection | undefined;
    }
  >({
    type: 'makeConnection',
    apply(params, _appliedData, currentState) {
      let connections = [...currentState.connections];

      const currentConnectionToInput = currentState.connections.find(
        (conn) => conn.inputNodeId === params.inputNodeId && conn.inputId === params.inputId,
      );

      if (currentConnectionToInput) {
        connections = connections.filter((conn) => conn !== currentConnectionToInput);
      }

      const newConnection = {
        inputNodeId: params.inputNodeId,
        inputId: params.inputId,
        outputNodeId: params.outputNodeId,
        outputId: params.outputId,
      };

      setConnections([...connections, newConnection]);

      return {
        newConnection,
        previousConnectionToInput: currentConnectionToInput,
      };
    },
    undo(_data, _appliedData, currentState) {
      let newConnections = [...currentState.connections];

      newConnections = newConnections.filter(
        (conn) =>
          conn.inputId !== _appliedData.newConnection.inputId &&
          conn.inputNodeId !== _appliedData.newConnection.inputNodeId &&
          conn.outputId !== _appliedData.newConnection.outputId &&
          conn.outputNodeId !== _appliedData.newConnection.outputNodeId,
      );

      if (_appliedData.previousConnectionToInput) {
        newConnections.push(_appliedData.previousConnectionToInput);
      }

      setConnections(newConnections);
    },
  });
}
