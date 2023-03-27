import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDroppable } from '@dnd-kit/core';
import { ChartNode, NodeConnection, NodeId, NodeInputId, NodeOutputDefinition, NodeOutputId } from '../model/NodeBase';
import { DraggableNode, ViewNode } from './DraggableNode';
import { css } from '@emotion/react';
import { nodeStyles } from './nodeStyles';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { produce } from 'immer';
import { ContextMenu } from './ContextMenu';
import { CSSTransition } from 'react-transition-group';
import { NodeType, nodeFactory } from '../model/Nodes';
import { WireDef, WireLayer } from './WireLayer';
import { useContextMenu } from '../hooks/useContextMenu';
import { useDraggingNode } from '../hooks/useDraggingNode';
import { useDraggingWire } from '../hooks/useDraggingWire';

export interface NodeCanvasProps {
  nodes: ChartNode<string, unknown>[];
  connections: NodeConnection[];
  onNodesChanged: (nodes: ChartNode<string, unknown>[]) => void;
  onConnectionsChanged: (connections: NodeConnection[]) => void;
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
  overflow: hidden;

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

export const NodeCanvas: FC<NodeCanvasProps> = ({ nodes, connections, onNodesChanged, onConnectionsChanged }) => {
  const { draggingNode, onNodeStartDrag, onNodeDragged } = useDraggingNode(nodes, onNodesChanged);
  const { draggingWire, onWireStartDrag, onWireEndDrag } = useDraggingWire(nodes, connections, onConnectionsChanged);

  const {
    contextMenuRef,
    showContextMenu,
    contextMenuPosition,
    handleContextMenu,
    setShowContextMenu,
    setContextMenuPosition,
  } = useContextMenu();

  const { setNodeRef } = useDroppable({ id: 'NodeCanvas' });

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
    [contextMenuPosition.x, contextMenuPosition.y, nodes, onNodesChanged, setShowContextMenu],
  );

  return (
    <DndContext onDragStart={onNodeStartDrag} onDragEnd={onNodeDragged}>
      <div ref={setNodeRef} css={styles} onContextMenu={handleContextMenu}>
        <div className="nodes">
          {nodes.map((node) => (
            <DraggableNode key={node.id} node={node} onWireStartDrag={onWireStartDrag} onWireEndDrag={onWireEndDrag} />
          ))}
        </div>
        <WireLayer nodes={nodes} connections={connections} draggingWire={draggingWire} />
        <DragOverlay dropAnimation={null}>
          {draggingNode ? <ViewNode node={draggingNode} isOverlay /> : null}
        </DragOverlay>
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
