import { nodesState } from '../state/graph.js';
import { useCallback } from 'react';
import { type ChartNode } from '@ironclad/rivet-core';
import { useSetAtom } from 'jotai';

export function useUpdateNode() {
  const setNodes = useSetAtom(nodesState);

  return useCallback(
    (node: ChartNode) => {
      setNodes((prevNodes) => {
        const nodeIndex = prevNodes.findIndex((n) => n.id === node.id);
        if (nodeIndex === -1) {
          return prevNodes;
        }
        return [...prevNodes.slice(0, nodeIndex), node, ...prevNodes.slice(nodeIndex + 1)];
      });
    },
    [setNodes],
  );
}
