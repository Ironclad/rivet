import { type NodeConnection, type NodeId, type PortId } from '@ironclad/rivet-core';
import { useCommand } from './Command';
import { useSetAtom } from 'jotai';
import { connectionsState } from '../state/graph';

export function useBreakConnectionCommand() {
  const setConnections = useSetAtom(connectionsState);

  return useCommand<
    {
      connectionToBreak: NodeConnection;
    },
    {
      brokenConnection: NodeConnection;
    }
  >({
    type: 'breakConnection',
    apply(params, _appliedData, currentState) {
      const connections = currentState.connections.filter((conn) => conn !== params.connectionToBreak);

      setConnections(connections);

      return {
        brokenConnection: params.connectionToBreak,
      };
    },
    undo(_data, appliedData, currentState) {
      setConnections([...currentState.connections, appliedData.brokenConnection]);
    },
  });
}
