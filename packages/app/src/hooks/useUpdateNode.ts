import { nodesState } from '../state/graph.js';
import { useCallback } from 'react';
import { type ChartNode } from '@ironclad/rivet-core';
import { useAtom } from 'jotai';

export function useUpdateNode() {
  const [nodes, setNodes] = useAtom(nodesState);

  return useCallback(
    (node: ChartNode) => {
      const nodeIndex = nodes.findIndex((n) => n.id === node.id);
      if (nodeIndex === -1) {
        setNodes(nodes);
      }
      setNodes([...nodes.slice(0, nodeIndex), node, ...nodes.slice(nodeIndex + 1)]);
    },
    [setNodes, nodes],
  );
}
