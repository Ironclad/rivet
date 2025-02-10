import { useSetAtom } from 'jotai';
import { useCommand } from './Command';
import { nodesState } from '../state/graph';
import { type NodeId } from '@ironclad/rivet-core';

export type NodePosition = {
  nodeId: NodeId;
  position: { x: number; y: number };
};

export function useMoveNodeCommand() {
  const setNodes = useSetAtom(nodesState);

  return useCommand<
    {
      moves: NodePosition[];
    },
    {
      previousPositions: NodePosition[];
    }
  >({
    type: 'moveNode',
    apply(params, _appliedData, currentState) {
      const previousPositions: NodePosition[] = params.moves.map((move) => {
        const node = currentState.nodes.find((n) => n.id === move.nodeId);
        if (!node) {
          throw new Error(`Node with id ${move.nodeId} not found`);
        }
        return {
          nodeId: move.nodeId,
          position: {
            x: node.visualData.x,
            y: node.visualData.y,
          },
        };
      });

      setNodes(
        currentState.nodes.map((node) => {
          const move = params.moves.find((m) => m.nodeId === node.id);
          if (move) {
            return {
              ...node,
              visualData: {
                ...node.visualData,
                x: move.position.x,
                y: move.position.y,
              },
            };
          }
          return node;
        }),
      );

      return {
        previousPositions,
      };
    },
    undo(_data, appliedData, currentState) {
      setNodes(
        currentState.nodes.map((node) => {
          const previousPosition = appliedData.previousPositions.find((p) => p.nodeId === node.id);
          if (previousPosition) {
            return {
              ...node,
              visualData: {
                ...node.visualData,
                x: previousPosition.position.x,
                y: previousPosition.position.y,
              },
            };
          }
          return node;
        }),
      );
    },
  });
}
