import { DndContext, DragOverlay, useDroppable } from '@dnd-kit/core';
import { DraggableNode, ViewNode } from './DraggableNode';
import { css } from '@emotion/react';
import { nodeStyles } from './nodeStyles';
import { FC, MutableRefObject, useCallback, useMemo, useRef, useState } from 'react';
import { ContextMenu } from './ContextMenu';
import { CSSTransition } from 'react-transition-group';
import { WireLayer } from './WireLayer';
import { ContextMenuData, useContextMenu } from '../hooks/useContextMenu';
import { useDraggingNode } from '../hooks/useDraggingNode';
import { useDraggingWire } from '../hooks/useDraggingWire';
import { ChartNode, NodeConnection } from '../model/NodeBase';
import { useRecoilState } from 'recoil';
import { canvasPositionState } from '../state/graphBuilder';
import { useCanvasPositioning } from '../hooks/useCanvasPositioning';

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

  .nodes {
    position: relative;
    z-index: 0;
  }

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

  .debug-overlay {
    position: absolute;
    top: 10px;
    left: 10px;
    padding: 10px 20px;
    border-radius: 5px;
    background-color: rgba(255, 255, 255, 0.03);
    color: var(--foreground);
    box-shadow: 0 2px 4px var(--shadow);
    z-index: 99999;
    font-size: 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .canvas-contents {
    transform-origin: top left;
  }

  .origin {
    position: absolute;
    left: -5px;
    top: -5px;
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
  const [canvasPosition, setCanvasPosition] = useRecoilState(canvasPositionState);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const { clientToCanvasPosition, canvasToClientPosition } = useCanvasPositioning();
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });

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

  const canvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) {
      return;
    }

    if ((e.target as HTMLElement).classList.contains('node-canvas') === false) {
      return;
    }

    setIsDraggingCanvas(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const canvasMouseMove = (e: React.MouseEvent) => {
    setLastMousePosition({ x: e.clientX, y: e.clientY });

    if (!isDraggingCanvas) return;

    const dx = (e.clientX - dragStart.x) * (1 / canvasPosition.zoom);
    const dy = (e.clientY - dragStart.y) * (1 / canvasPosition.zoom);

    setCanvasPosition((prevPos) => ({ x: prevPos.x + dx, y: prevPos.y + dy, zoom: prevPos.zoom }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleZoom = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();

    const zoomSpeed = 0.01;

    const zoomFactor = event.deltaY < 0 ? 1 + zoomSpeed : 1 - zoomSpeed;
    const newZoom = canvasPosition.zoom * zoomFactor;

    const currentMousePosCanvas = clientToCanvasPosition(event.clientX, event.clientY);
    const newX = event.clientX / newZoom - canvasPosition.x;
    const newY = event.clientY / newZoom - canvasPosition.y;

    const diff = {
      x: newX - currentMousePosCanvas.x,
      y: newY - currentMousePosCanvas.y,
    };

    // Step 7: Update the canvas position and zoom value
    setCanvasPosition((pos) => ({
      x: pos.x + diff.x,
      y: pos.y + diff.y,
      zoom: newZoom,
    }));
  };

  const canvasMouseUp = (e: React.MouseEvent) => {
    setIsDraggingCanvas(false);
  };

  return (
    <DndContext onDragStart={onNodeStartDrag} onDragEnd={onNodeDragged}>
      <div
        ref={setNodeRef}
        className="node-canvas"
        css={styles}
        onContextMenu={handleContextMenu}
        onMouseDown={canvasMouseDown}
        onMouseMove={canvasMouseMove}
        onMouseUp={canvasMouseUp}
        onMouseLeave={canvasMouseUp}
        onWheel={handleZoom}
        style={{
          backgroundPosition: `${(canvasPosition.x % 20) - 1}px ${(canvasPosition.y % 20) - 1}px`,
        }}
      >
        <div className="debug-overlay">
          <div>Translation: {`(${canvasPosition.x.toFixed(2)}, ${canvasPosition.y.toFixed(2)})`}</div>
          <div>Scale: {canvasPosition.zoom.toFixed(2)}</div>
          <div>Mouse Position: {`(${lastMousePosition.x.toFixed(2)}, ${lastMousePosition.y.toFixed(2)})`}</div>
          <div>
            Translated Mouse Position:{' '}
            {`(${clientToCanvasPosition(lastMousePosition.x, lastMousePosition.y).x.toFixed(
              2,
            )}, ${clientToCanvasPosition(lastMousePosition.x, lastMousePosition.y).y.toFixed(2)})`}
          </div>
        </div>
        <div
          className="canvas-contents"
          style={{
            transform: `scale(${canvasPosition.zoom}) translate(${canvasPosition.x}px, ${canvasPosition.y}px)`,
          }}
        >
          {/* <svg className="origin" width="10" height="10" viewBox="-5 -5 10 10">
            <circle fill="white" r="5" cx="0" cy="0" />
          </svg> */}
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
        <WireLayer nodes={nodes} connections={connections} draggingWire={draggingWire} />

        <DragOverlay dropAnimation={null}>
          {draggingNode ? <ViewNode node={draggingNode} connections={draggingNodeConnections} isOverlay /> : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};
