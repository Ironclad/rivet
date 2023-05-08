import { useRecoilValue } from 'recoil';
import { connectionsSelector } from '../state/graph';
import { ChartNode } from '../model/NodeBase';
import { useCallback } from 'react';

export function useGetConnectionsForNode() {
  const connections = useRecoilValue(connectionsSelector);

  return useCallback(
    (node: ChartNode) => {
      return connections.filter((connection) => {
        return connection.inputNodeId === node.id || connection.outputNodeId === node.id;
      });
    },
    [connections],
  );
}
