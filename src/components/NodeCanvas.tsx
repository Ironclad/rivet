import { DndContext, DragOverlay, useDroppable } from '@dnd-kit/core';
import { DraggableNode, ViewNode } from './DraggableNode';
import { css } from '@emotion/react';
import { nodeStyles } from './nodeStyles';
import { FC, useCallback, useMemo } from 'react';
import { ContextMenu } from './ContextMenu';
import { CSSTransition } from 'react-transition-group';
import { NodeType, nodeFactory } from '../model/Nodes';
import { WireLayer } from './WireLayer';
import { useContextMenu } from '../hooks/useContextMenu';
import { useDraggingNode } from '../hooks/useDraggingNode';
import { useDraggingWire } from '../hooks/useDraggingWire';
import { NodeGraph } from '../model/NodeGraph';
import { ChartNode, NodeConnection, NodeId } from '../model/NodeBase';

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

  const onContextMenuItemSelected = useCallback(
    (menuItemId: string) => {
      if (menuItemId.startsWith('Add:')) {
        const nodeType = menuItemId.substring(4) as NodeType;
        const newNode = nodeFactory(nodeType);

        newNode.visualData = {
          x: contextMenuData.x,
          y: contextMenuData.y,
        };

        onNodesChanged?.([...nodes, newNode]);
        setShowContextMenu(false);
        return;
      }

      if (menuItemId.startsWith('Delete:')) {
        const nodeId = menuItemId.substring(7) as NodeId;
        const nodeIndex = nodes.findIndex((n) => n.id === nodeId);
        if (nodeIndex >= 0) {
          const newNodes = [...nodes];
          newNodes.splice(nodeIndex, 1);
          onNodesChanged?.(newNodes);
        }
        setShowContextMenu(false);
        return;
      }
    },
    [contextMenuData.x, contextMenuData.y, nodes, onNodesChanged, setShowContextMenu],
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
              onWireStartDrag={onWireStartDrag}
              onWireEndDrag={onWireEndDrag}
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
            onMenuItemSelected={onContextMenuItemSelected}
          />
        </CSSTransition>
      </div>
    </DndContext>
  );
};
