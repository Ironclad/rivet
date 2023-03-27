import { DndContext, DragEndEvent, useDroppable } from '@dnd-kit/core';
import { ChartNode } from '../model/NodeBase';
import { DraggableNode } from './DraggableNode';
import { css } from '@emotion/react';
import { nodeStyles } from './nodeStyles';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { produce } from 'immer';
import { ContextMenu } from './ContextMenu';

export interface NodeCanvasProps {
  nodes: ChartNode<string, unknown>[];
  onNodesChanged: (nodes: ChartNode<string, unknown>[]) => void;
}

const styles = css`
  width: 100vw;
  height: 100vh;
  position: relative;
  background-color: #282c34;
  background-image: linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 20px 20px;
  background-position: -1px -1px;

  ${nodeStyles}
`;

export const NodeCanvas: FC<NodeCanvasProps> = ({ nodes, onNodesChanged }) => {
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [nodeToAdd, setNodeToAdd] = useState('');

  const handleContextMenu = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
  }, []);

  const { setNodeRef } = useDroppable({ id: 'NodeCanvas' });

  const onNodeDragged = useCallback(
    ({ active, delta }: DragEndEvent) => {
      const nodeId = active.id;

      onNodesChanged?.(
        produce(nodes, (draft) => {
          const node = draft.find((node) => node.id === nodeId);
          if (node) {
            node.visualData.x += delta.x;
            node.visualData.y += delta.y;
          }
        }),
      );
    },
    [nodes, onNodesChanged],
  );

  useEffect(() => {
    const handleWindowClick = (event: MouseEvent) => {
      // Close context menu if clicked outside of it
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenuPosition(null);
      }
    };

    window.addEventListener('click', handleWindowClick);
    return () => {
      window.removeEventListener('click', handleWindowClick);
    };
  }, []);

  return (
    <DndContext onDragEnd={onNodeDragged}>
      <div ref={setNodeRef} css={styles} onContextMenu={handleContextMenu}>
        <div className="nodes">
          {nodes.map((node) => (
            <DraggableNode key={node.id} node={node} />
          ))}
        </div>
        {contextMenuPosition && (
          <ContextMenu
            ref={contextMenuRef}
            x={contextMenuPosition.x}
            y={contextMenuPosition.y}
            onClose={() => setContextMenuPosition(null)}
            onNodeSelected={(nodeType: string) => {
              setNodeToAdd(nodeType);
              setContextMenuPosition(null);
            }}
          />
        )}
      </div>
    </DndContext>
  );
};
