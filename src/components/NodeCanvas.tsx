import { DndContext, DragOverlay, useDroppable } from '@dnd-kit/core';
import { DraggableNode, ViewNode } from './DraggableNode';
import { css } from '@emotion/react';
import { nodeStyles } from './nodeStyles';
import { FC, useCallback, useMemo } from 'react';
import { ContextMenu } from './ContextMenu';
import { CSSTransition } from 'react-transition-group';
import { WireLayer } from './WireLayer';
import { ContextMenuData, useContextMenu } from '../hooks/useContextMenu';
import { useDraggingNode } from '../hooks/useDraggingNode';
import { useDraggingWire } from '../hooks/useDraggingWire';
import { ChartNode, NodeConnection } from '../model/NodeBase';

export interface NodeCanvasProps {
  nodes: ChartNode<string, unknown>[];
  connections: NodeConnection[];
  selectedNode: ChartNode<string, unknown> | null;
  onNodesChanged: (nodes: ChartNode<string, unknown>[]) => void;
  onConnectionsChanged: (connections: NodeConnection[]) => void;
  onNodeSelected: (node: ChartNode<string, unknown>) => void;
  onContextMenuItemSelected?: (menuItemId: string, contextMenuData: ContextMenuData) => void;
}

const styles = css`
  width: 100vw;
  height: 100vh;
  position: relative;
  background-color: var(--grey-darker);
  background-image: linear-gradient(to right, var(--grey-subtle-accent) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grey-subtle-accent) 1px, transparent 1px);
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

export const NodeCanvas: FC<NodeCanvasProps> = ({
  nodes,
  connections,
  selectedNode,
  onNodesChanged,
  onConnectionsChanged,
  onNodeSelected,
  onContextMenuItemSelected,
}) => {
  const { draggingNode, onNodeStartDrag, onNodeDragged } = useDraggingNode(nodes, onNodesChanged);
  const { draggingWire, onWireStartDrag, onWireEndDrag } = useDraggingWire(nodes, connections, onConnectionsChanged);

  const {
    contextMenuRef,
    showContextMenu,
    contextMenuData,
    handleContextMenu,
    setShowContextMenu,
    setContextMenuData,
  } = useContextMenu();

  const { setNodeRef } = useDroppable({ id: 'NodeCanvas' });

  const nodesWithConnections = useMemo(() => {
    return nodes.map((node) => {
      const nodeConnections = connections.filter((c) => c.inputNodeId === node.id || c.outputNodeId === node.id);
      return { node, nodeConnections };
    });
  }, [connections, nodes]);

  const draggingNodeConnections = useMemo(() => {
    return draggingNode
      ? connections.filter((c) => c.inputNodeId === draggingNode.id || c.outputNodeId === draggingNode.id)
      : [];
  }, [connections, draggingNode]);

  const contextMenuItemSelected = useCallback(
    (menuItemId: string) => {
      onContextMenuItemSelected?.(menuItemId, contextMenuData);
      setShowContextMenu(false);
    },
    [contextMenuData, onContextMenuItemSelected, setShowContextMenu],
  );

  return (
    <DndContext onDragStart={onNodeStartDrag} onDragEnd={onNodeDragged}>
      <div ref={setNodeRef} css={styles} onContextMenu={handleContextMenu}>
        <div className="nodes">
          {nodesWithConnections.map(({ node, nodeConnections }) => (
            <DraggableNode
              key={node.id}
              node={node}
              connections={nodeConnections}
              isSelected={selectedNode?.id === node.id}
              onWireStartDrag={onWireStartDrag}
              onWireEndDrag={onWireEndDrag}
              onNodeSelected={onNodeSelected}
            />
          ))}
        </div>
        <WireLayer nodes={nodes} connections={connections} draggingWire={draggingWire} />
        <DragOverlay dropAnimation={null}>
          {draggingNode ? <ViewNode node={draggingNode} connections={draggingNodeConnections} isOverlay /> : null}
        </DragOverlay>
        <CSSTransition
          nodeRef={contextMenuRef}
          in={showContextMenu}
          timeout={200}
          classNames="context-menu"
          unmountOnExit
          onExited={() => setContextMenuData({ x: 0, y: 0, data: null })}
        >
          <ContextMenu
            ref={contextMenuRef}
            x={contextMenuData.x}
            y={contextMenuData.y}
            data={contextMenuData.data}
            onMenuItemSelected={contextMenuItemSelected}
          />
        </CSSTransition>
      </div>
    </DndContext>
  );
};
