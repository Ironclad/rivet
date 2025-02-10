import { useSetAtom } from 'jotai';
import { useCommand } from './Command';
import { nodesState } from '../state/graph';
import { globalRivetNodeRegistry, type NodeId } from '@ironclad/rivet-core';

export function useAddNodeCommand() {
  const setNodes = useSetAtom(nodesState);

  return useCommand<{ nodeType: string; position: { x: number; y: number } }, { id: NodeId }>({
    type: 'addNode',
    apply(params, appliedData, currentState) {
      const newNode = globalRivetNodeRegistry.createDynamic(params.nodeType);

      newNode.visualData.x = params.position.x;
      newNode.visualData.y = params.position.y;

      if (appliedData) {
        newNode.id = appliedData.id;
      }

      // We've added more buttons at the top so just... increase the width of every node a little bit :/
      newNode.visualData.width = (newNode.visualData.width ?? 200) + 30;

      setNodes([...currentState.nodes, newNode]);

      return { id: newNode.id };
    },
    undo(_data, { id }) {
      setNodes((allNodes) => allNodes.filter((node) => node.id !== id));
    },
  });
}
