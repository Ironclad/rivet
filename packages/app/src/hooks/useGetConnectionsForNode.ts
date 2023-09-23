import { useRecoilValue } from 'recoil';
import { connectionsState } from '../state/graph.js';
import { type ChartNode } from '@ironclad/rivet-core';
import { useCallback } from 'react';

export function useGetConnectionsForNode() {
  const connections = useRecoilValue(connectionsState);

  return useCallback(
    (node: ChartNode) => {
      return connections.filter((connection) => {
        return connection.inputNodeId === node.id || connection.outputNodeId === node.id;
      });
    },
    [connections],
  );
}
