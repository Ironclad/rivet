import { DndContext, DragOverlay, useDroppable } from '@dnd-kit/core';
import { DraggableNode } from './DraggableNode';
import { css } from '@emotion/react';
import { nodeStyles } from './nodeStyles';
import { FC, useMemo, useState } from 'react';
import { ContextMenu } from './ContextMenu';
import { CSSTransition } from 'react-transition-group';
import { WireLayer } from './WireLayer';
import { ContextMenuData, useContextMenu } from '../hooks/useContextMenu';
import { useDraggingNode } from '../hooks/useDraggingNode';
import { useDraggingWire } from '../hooks/useDraggingWire';
import { ChartNode, NodeConnection, NodeId } from '@ironclad/nodai-core';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { canvasPositionState, lastMousePositionState, selectedNodeState } from '../state/graphBuilder';
import { useCanvasPositioning } from '../hooks/useCanvasPositioning';
import { VisualNode } from './VisualNode';
import { useStableCallback } from '../hooks/useStableCallback';
import { useThrottleFn } from 'ahooks';
import produce from 'immer';

export interface NodeCanvasProps {
  nodes: ChartNode[];
  connections: NodeConnection[];
  selectedNode: ChartNode | null;
  onNodesChanged: (nodes: ChartNode[]) => void;
  onConnectionsChanged: (connections: NodeConnection[]) => void;
  onNodeSelected: (node: ChartNode) => void;
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
  z-index: 0;

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
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, canvasStartX: 0, canvasStartY: 0 });
  const { clientToCanvasPosition } = useCanvasPositioning();
  const setLastMousePosition = useSetRecoilState(lastMousePositionState);
  const setSelectedNode = useSetRecoilState(selectedNodeState);

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

  const contextMenuItemSelected = useStableCallback((menuItemId: string) => {
    onContextMenuItemSelected?.(menuItemId, contextMenuData);
    setShowContextMenu(false);
  });

  const canvasMouseDown = useStableCallback((e: React.MouseEvent) => {
    if (e.button !== 0) {
      return;
    }

    if ((e.target as HTMLElement).classList.contains('node-canvas') === false) {
      return;
    }

    e.preventDefault();

    setIsDraggingCanvas(true);
    setDragStart({ x: e.clientX, y: e.clientY, canvasStartX: canvasPosition.x, canvasStartY: canvasPosition.y });
  });

  const canvasMouseMove = useThrottleFn(
    (e: React.MouseEvent) => {
      setLastMousePosition({ x: e.clientX, y: e.clientY });

      if (!isDraggingCanvas) return;

      const dx = (e.clientX - dragStart.x) * (1 / canvasPosition.zoom);
      const dy = (e.clientY - dragStart.y) * (1 / canvasPosition.zoom);

      setCanvasPosition({ x: dragStart.canvasStartX + dx, y: dragStart.canvasStartY + dy, zoom: canvasPosition.zoom });
    },
    { wait: 10 },
  );

  const isScrollable = (element: HTMLElement): boolean => {
    const style = window.getComputedStyle(element);
    const isVerticalScrollable = element.scrollHeight > element.clientHeight && style.overflowY === 'auto';
    const isHorizontalScrollable = element.scrollWidth > element.clientWidth && style.overflowX === 'auto';

    return isVerticalScrollable || isHorizontalScrollable;
  };

  const isAnyParentScrollable = (element: HTMLElement): boolean => {
    let currentNode = element.parentElement;

    while (currentNode) {
      if (isScrollable(currentNode)) {
        return true;
      }
      currentNode = currentNode.parentElement;
    }

    return false;
  };

  // I think safari deals with wheel events differently, so we need to throttle the zooming
  // because otherwise it lags like CRAZY
  const zoomDebounced = useThrottleFn(
    (target: HTMLElement, wheelDelta: number, clientX: number, clientY: number) => {
      if (isAnyParentScrollable(target)) {
        return;
      }

      const zoomSpeed = 0.025;

      const zoomFactor = wheelDelta < 0 ? 1 + zoomSpeed : 1 - zoomSpeed;
      const newZoom = canvasPosition.zoom * zoomFactor;

      const currentMousePosCanvas = clientToCanvasPosition(clientX, clientY);
      const newX = clientX / newZoom - canvasPosition.x;
      const newY = clientY / newZoom - canvasPosition.y;

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
    },
    { wait: 25 },
  );

  const handleZoom = useStableCallback((event: React.WheelEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;

    zoomDebounced.run(target, event.deltaY, event.clientX, event.clientY);
  });

  const canvasMouseUp = (e: React.MouseEvent) => {
    if (!isDraggingCanvas) {
      return;
    }

    setIsDraggingCanvas(false);

    const clientDelta = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    };

    // If use hasn't moved mouse much, consider it a "click"
    const distance = Math.sqrt(clientDelta.x * clientDelta.x + clientDelta.y * clientDelta.y);
    if (distance < 5) {
      setSelectedNode(null);
    }
  };

  const onNodeWidthChanged = useStableCallback((node: ChartNode, width: number) => {
    onNodesChanged(
      produce(nodes, (draft) => {
        const foundNode = draft.find((n) => n.id === node.id);
        if (foundNode) {
          foundNode.visualData.width = width;
        }
      }),
    );
  });

  const [hoveringNode, setHoveringNode] = useState<NodeId | undefined>();

  const onNodeMouseOver = useStableCallback((_e: any, nodeId: NodeId) => {
    setHoveringNode(nodeId);
  });

  const onNodeMouseOut = useStableCallback(() => {
    setHoveringNode(undefined);
  });

  const highlightedNodes = useMemo(() => {
    const hNodes = [];
    if (selectedNode) {
      hNodes.push(selectedNode.id);
    }
    if (hoveringNode) {
      hNodes.push(hoveringNode);
    }
    return hNodes;
  }, [selectedNode, hoveringNode]);

  return (
    <DndContext onDragStart={onNodeStartDrag} onDragEnd={onNodeDragged}>
      <div
        ref={setNodeRef}
        className="node-canvas"
        css={styles}
        onContextMenu={handleContextMenu}
        onMouseDown={canvasMouseDown}
        onMouseMove={canvasMouseMove.run}
        onMouseUp={canvasMouseUp}
        onMouseLeave={canvasMouseUp}
        onWheel={handleZoom}
        style={{
          backgroundPosition: `${canvasPosition.x - 1}px ${canvasPosition.y - 1}px`,
          backgroundSize: `${20 * canvasPosition.zoom}px ${20 * canvasPosition.zoom}px`,
        }}
      >
        <DebugOverlay enabled={false} />
        <div
          className="canvas-contents"
          style={{
            transform: `scale(${canvasPosition.zoom}, ${canvasPosition.zoom}) translate(${canvasPosition.x}px, ${canvasPosition.y}px) translateZ(-1px)`,
          }}
        >
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
                onNodeWidthChanged={onNodeWidthChanged}
                onMouseOver={onNodeMouseOver}
                onMouseOut={onNodeMouseOut}
              />
            ))}
          </div>
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
        <WireLayer
          nodes={nodes}
          connections={connections}
          draggingWire={draggingWire}
          highlightedNodes={highlightedNodes}
        />

        <DragOverlay dropAnimation={null}>
          {draggingNode ? (
            <VisualNode
              node={draggingNode}
              connections={draggingNodeConnections}
              isOverlay
              scale={canvasPosition.zoom}
            />
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

const DebugOverlay: FC<{ enabled: boolean }> = ({ enabled }) => {
  const canvasPosition = useRecoilValue(canvasPositionState);

  const lastMousePosition = useRecoilValue(lastMousePositionState);

  const { clientToCanvasPosition } = useCanvasPositioning();

  if (!enabled) {
    return null;
  }

  return (
    <div className="debug-overlay">
      <div>Translation: {`(${canvasPosition.x.toFixed(2)}, ${canvasPosition.y.toFixed(2)})`}</div>
      <div>Scale: {canvasPosition.zoom.toFixed(2)}</div>
      <div>Mouse Position: {`(${lastMousePosition.x.toFixed(2)}, ${lastMousePosition.y.toFixed(2)})`}</div>
      <div>
        Translated Mouse Position:{' '}
        {`(${clientToCanvasPosition(lastMousePosition.x, lastMousePosition.y).x.toFixed(2)}, ${clientToCanvasPosition(
          lastMousePosition.x,
          lastMousePosition.y,
        ).y.toFixed(2)})`}
      </div>
    </div>
  );
};
