import { DndContext, DragEndEvent, useDroppable } from '@dnd-kit/core';
import { ChartNode } from '../model/NodeBase';
import { DraggableNode } from './DraggableNode';
import { css } from '@emotion/react';
import { nodeStyles } from './nodeStyles';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { produce } from 'immer';
import { ContextMenu } from './ContextMenu';
import { CSSTransition } from 'react-transition-group';
import { NodeType, nodeFactory } from '../model/Nodes';

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

  .context-menu {
    display: none;
  }

  .context-menu-enter {
    display: block;
    opacity: 0;
  }

  .context-menu-enter-active {
    opacity: 1;
    transition: opacity 100ms ease-out;
  }

  .context-menu-exit {
    opacity: 1;
  }

  .context-menu-exit-active {
    opacity: 0;
    transition: opacity 100ms ease-out;
  }

  ${nodeStyles}
`;

export const NodeCanvas: FC<NodeCanvasProps> = ({ nodes, onNodesChanged }) => {
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  const handleContextMenu = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    setShowContextMenu(true);
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
        setShowContextMenu(false);
      }
    };

    window.addEventListener('click', handleWindowClick);
    return () => {
      window.removeEventListener('click', handleWindowClick);
    };
  }, []);

  const onContextMenuItemSelected = useCallback(
    (menuItemId: string) => {
      if (menuItemId.startsWith('Add:')) {
        const nodeType = menuItemId.substring(4) as NodeType;
        const newNode = nodeFactory(nodeType);

        newNode.visualData = {
          x: contextMenuPosition.x,
          y: contextMenuPosition.y,
        };

        onNodesChanged?.([...nodes, newNode]);
        setShowContextMenu(false);
      }
    },
    [contextMenuPosition.x, contextMenuPosition.y, nodes, onNodesChanged],
  );

  return (
    <DndContext onDragEnd={onNodeDragged}>
      <div ref={setNodeRef} css={styles} onContextMenu={handleContextMenu}>
        <div className="nodes">
          {nodes.map((node) => (
            <DraggableNode key={node.id} node={node} />
          ))}
        </div>
        <CSSTransition
          nodeRef={contextMenuRef}
          in={showContextMenu}
          timeout={200}
          classNames="context-menu"
          unmountOnExit
          onExited={() => setContextMenuPosition({ x: 0, y: 0 })}
        >
          <ContextMenu
            ref={contextMenuRef}
            x={contextMenuPosition.x}
            y={contextMenuPosition.y}
            onMenuItemSelected={onContextMenuItemSelected}
          />
        </CSSTransition>
      </div>
    </DndContext>
  );
};
