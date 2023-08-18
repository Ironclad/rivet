import { DndContext, DragOverlay, useDroppable } from '@dnd-kit/core';
import { DraggableNode } from './DraggableNode.js';
import { css } from '@emotion/react';
import { nodeStyles } from './nodeStyles.js';
import { FC, useMemo, useRef, useState } from 'react';
import { ContextMenu, ContextMenuContext } from './ContextMenu.js';
import { CSSTransition } from 'react-transition-group';
import { WireLayer } from './WireLayer.js';
import { useContextMenu } from '../hooks/useContextMenu.js';
import { useDraggingNode } from '../hooks/useDraggingNode.js';
import { useDraggingWire } from '../hooks/useDraggingWire.js';
import { ChartNode, CommentNode, GraphId, NodeConnection, NodeId } from '@ironclad/rivet-core';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import {
  CanvasPosition,
  canvasPositionState,
  editingNodeState,
  lastCanvasPositionByGraphState,
  lastMousePositionState,
  selectedNodesState,
} from '../state/graphBuilder';
import { useCanvasPositioning } from '../hooks/useCanvasPositioning.js';
import { VisualNode } from './VisualNode.js';
import { useStableCallback } from '../hooks/useStableCallback.js';
import { useThrottleFn } from 'ahooks';
import { produce } from 'immer';
import { graphMetadataState } from '../state/graph.js';
import { useViewportBounds } from '../hooks/useViewportBounds.js';
import { nanoid } from 'nanoid/non-secure';
import { useGlobalHotkey } from '../hooks/useGlobalHotkey.js';
import { useWireDragScrolling } from '../hooks/useWireDragScrolling';

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
    position: absolute;
    display: none;
  }

  .context-menu-enter {
    display: block;
    opacity: 0;
    position: absolute;
  }

  .context-menu-enter-active {
    opacity: 1;
    transition: opacity 100ms ease-out;
    position: absolute;
  }

  .context-menu-exit {
    opacity: 1;
    position: absolute;
  }

  .context-menu-exit-active {
    opacity: 0;
    transition: opacity 100ms ease-out;
    position: absolute;
  }

  .context-menu-exit-done {
    opacity: 0;
    position: absolute;
    left: -1000px;
  }

  .debug-overlay {
    position: absolute;
    top: 50px;
    left: 50px;
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

  .selection-box {
    position: absolute;
    border: 2px dashed var(--primary);
    background-color: var(--primary-5percent);
    z-index: 2000;
  }

  ${nodeStyles}
`;

export interface NodeCanvasProps {
  nodes: ChartNode[];
  connections: NodeConnection[];
  selectedNodes: ChartNode[];
  onNodesChanged: (nodes: ChartNode[]) => void;
  onConnectionsChanged: (connections: NodeConnection[]) => void;
  onNodeSelected: (node: ChartNode, multi: boolean) => void;
  onNodeStartEditing?: (node: ChartNode) => void;
  onContextMenuItemSelected?: (
    menuItemId: string,
    data: unknown,
    context: ContextMenuContext,
    meta: { x: number; y: number },
  ) => void;
}

export const NodeCanvas: FC<NodeCanvasProps> = ({
  nodes,
  connections,
  onNodesChanged,
  onConnectionsChanged,
  onNodeSelected,
  onNodeStartEditing,
  onContextMenuItemSelected,
}) => {
  const [canvasPosition, setCanvasPosition] = useRecoilState(canvasPositionState);
  const selectedGraphMetadata = useRecoilValue(graphMetadataState);

  const setLastSavedCanvasPosition = useSetRecoilState(lastCanvasPositionByGraphState);

  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, canvasStartX: 0, canvasStartY: 0 });
  const { clientToCanvasPosition } = useCanvasPositioning();
  const setLastMousePosition = useSetRecoilState(lastMousePositionState);

  const lastMouseInfoRef = useRef<{ x: number; y: number; target: EventTarget | undefined }>({
    x: -3000,
    y: 0,
    target: undefined,
  });

  const [editingNodeId, setEditingNodeId] = useRecoilState(editingNodeState);
  const [selectedNodeIds, setSelectedNodeIds] = useRecoilState(selectedNodesState);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(
    null,
  );

  const { draggingNodes, onNodeStartDrag, onNodeDragged } = useDraggingNode(onNodesChanged);
  const { draggingWire, onWireStartDrag, onWireEndDrag } = useDraggingWire(onConnectionsChanged);
  useWireDragScrolling();

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
    return draggingNodes.flatMap((draggingNode) =>
      connections.filter((c) => c.inputNodeId === draggingNode.id || c.outputNodeId === draggingNode.id),
    );
  }, [connections, draggingNodes]);

  const contextMenuItemSelected = useStableCallback(
    (itemId: string, data: unknown, context: ContextMenuContext, meta: { x: number; y: number }) => {
      onContextMenuItemSelected?.(itemId, data, context, meta);
      setShowContextMenu(false);
    },
  );

  const canvasMouseDown = useStableCallback((e: React.MouseEvent) => {
    if (e.button !== 0) {
      return;
    }

    if ((e.target as HTMLElement).classList.contains('node-canvas') === false) {
      return;
    }

    e.preventDefault();

    if (e.shiftKey) {
      setSelectionBox({ x: e.clientX, y: e.clientY, width: 0, height: 0 });
    } else {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX, y: e.clientY, canvasStartX: canvasPosition.x, canvasStartY: canvasPosition.y });
    }
  });

  const canvasMouseMove = useThrottleFn(
    (e: React.MouseEvent) => {
      setLastMousePosition({ x: e.clientX, y: e.clientY });
      lastMouseInfoRef.current = { x: e.clientX, y: e.clientY, target: e.target };

      if (selectionBox) {
        const newBox = {
          ...selectionBox!,
          width: e.clientX - selectionBox!.x,
          height: e.clientY - selectionBox!.y,
        };
        setSelectionBox(newBox);

        const topLeft = {
          x: newBox.width < 0 ? newBox.x + newBox.width : newBox.x,
          y: newBox.height < 0 ? newBox.y + newBox.height : newBox.y,
        };
        const bottomRight = {
          x: newBox.width < 0 ? newBox.x : newBox.x + newBox.width,
          y: newBox.height < 0 ? newBox.y : newBox.y + newBox.height,
        };

        const canvasStartPoint = clientToCanvasPosition(topLeft.x, topLeft.y);
        const canvasEndPoint = clientToCanvasPosition(bottomRight.x, bottomRight.y);

        const nodesInBox = nodes.filter((node) => {
          const nodeWidth = node.visualData.width ?? 150;
          const nodeHeight = 150; // Assuming the height is 150

          const nodeArea = nodeWidth * nodeHeight;
          const halfNodeArea = nodeArea / 2;

          // Calculate the area of intersection
          const xOverlap = Math.max(
            0,
            Math.min(canvasEndPoint.x, node.visualData.x + nodeWidth) - Math.max(canvasStartPoint.x, node.visualData.x),
          );
          const yOverlap = Math.max(
            0,
            Math.min(canvasEndPoint.y, node.visualData.y + nodeHeight) -
              Math.max(canvasStartPoint.y, node.visualData.y),
          );
          const overlapArea = xOverlap * yOverlap;

          // Check if at least 50% of the node is in the selection box
          return overlapArea > 0 && overlapArea >= halfNodeArea;
        });

        const isSameSetOfNodes =
          selectedNodeIds.length === nodesInBox.length &&
          selectedNodeIds.every((node) => nodesInBox.some((n) => n.id === node));
        if (!isSameSetOfNodes) {
          setSelectedNodeIds(nodesInBox.map((node) => node.id));
        }
      } else if (isDraggingCanvas) {
        const dx = (e.clientX - dragStart.x) * (1 / canvasPosition.zoom);
        const dy = (e.clientY - dragStart.y) * (1 / canvasPosition.zoom);

        const position: CanvasPosition = {
          x: dragStart.canvasStartX + dx,
          y: dragStart.canvasStartY + dy,
          zoom: canvasPosition.zoom,
        };
        setCanvasPosition(position);
        setLastSavedCanvasPosition((saved) => ({ ...saved, [selectedGraphMetadata!.id!]: position }));
      }
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

      const position: CanvasPosition = {
        x: canvasPosition.x + diff.x,
        y: canvasPosition.y + diff.y,
        zoom: newZoom,
      };

      setCanvasPosition(position);

      setLastSavedCanvasPosition((saved) => ({ ...saved, [selectedGraphMetadata!.id!]: position }));
    },
    { wait: 25 },
  );

  const handleZoom = useStableCallback((event: React.WheelEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;

    zoomDebounced.run(target, event.deltaY, event.clientX, event.clientY);
  });

  const canvasMouseUp = (e: React.MouseEvent) => {
    if (selectionBox) {
      setSelectionBox(null);
    } else if (!isDraggingCanvas) {
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
      setEditingNodeId(null);
      setSelectedNodeIds([]);
    }
  };

  const onNodeSizeChanged = useStableCallback((node: ChartNode, width: number, height: number) => {
    onNodesChanged(
      produce(nodes, (draft) => {
        const foundNode = draft.find((n) => n.id === node.id);
        if (foundNode) {
          foundNode.visualData.width = width;
        }

        if (foundNode?.type === 'comment') {
          (foundNode as CommentNode).data.height = height;
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
    const hNodes = new Set(selectedNodeIds);

    if (editingNodeId) {
      hNodes.add(editingNodeId);
    }

    if (hoveringNode) {
      hNodes.add(hoveringNode);
    }
    return [...hNodes];
  }, [selectedNodeIds, hoveringNode, editingNodeId]);

  const nodeSelected = useStableCallback((node: ChartNode, multi: boolean) => {
    onNodeSelected?.(node, multi);
  });

  const nodeStartEditing = useStableCallback((node: ChartNode) => {
    onNodeStartEditing?.(node);
  });

  const viewportBounds = useViewportBounds();

  useGlobalHotkey(
    'Space',
    (e) => {
      e.preventDefault();
      handleContextMenu({
        clientX: lastMouseInfoRef.current.x!,
        clientY: lastMouseInfoRef.current.y!,
        target: lastMouseInfoRef.current.target!,
      });
    },
    { notWhenInputFocused: true },
  );

  const handleCanvasContextMenu = useStableCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleContextMenu(e);
  });

  const hydratedContextMenuData = useMemo((): ContextMenuContext | null => {
    if (contextMenuData.data?.type.startsWith('node-')) {
      const nodeType = contextMenuData.data.type.replace('node-', '');
      const nodeId = contextMenuData.data.element.dataset.nodeid as NodeId;
      return {
        type: 'node',
        data: {
          nodeType,
          nodeId,
        },
      };
    }

    return {
      type: 'blankArea',
      data: {},
    };
  }, [contextMenuData]);

  // Idk, before we were able to unmount the context menu, but safari be weird,
  // so we move it off screen instead
  const [contextMenuDisabled, setContextMenuDisabled] = useState(true);

  return (
    <DndContext onDragStart={onNodeStartDrag} onDragEnd={onNodeDragged}>
      <div
        ref={setNodeRef}
        className="node-canvas"
        css={styles}
        onContextMenu={handleCanvasContextMenu}
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
            {nodesWithConnections.map(({ node, nodeConnections }) => {
              if (
                node.visualData.x < viewportBounds.left - (node.visualData.width ?? 300) ||
                node.visualData.x > viewportBounds.right + (node.visualData.width ?? 300) ||
                node.visualData.y < viewportBounds.top - 500 ||
                node.visualData.y > viewportBounds.bottom + 500
              ) {
                return null;
              }

              if (draggingNodes.some((n) => n.id === node.id)) {
                return null;
              }
              return (
                <DraggableNode
                  key={node.id}
                  node={node}
                  connections={nodeConnections}
                  isSelected={highlightedNodes.includes(node.id)}
                  onWireStartDrag={onWireStartDrag}
                  onWireEndDrag={onWireEndDrag}
                  onNodeSelected={nodeSelected}
                  onNodeStartEditing={nodeStartEditing}
                  onNodeSizeChanged={onNodeSizeChanged}
                  onMouseOver={onNodeMouseOver}
                  onMouseOut={onNodeMouseOut}
                />
              );
            })}
          </div>
          <DragOverlay
            dropAnimation={null}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
            }}
            modifiers={[
              (args) => {
                return {
                  scaleX: 1,
                  scaleY: 1,
                  x: args.transform.x / canvasPosition.zoom,
                  y: args.transform.y / canvasPosition.zoom,
                };
              },
            ]}
          >
            {draggingNodes.map((node) => (
              <VisualNode key={node.id} node={node} connections={draggingNodeConnections} isOverlay />
            ))}
          </DragOverlay>
        </div>
        <CSSTransition
          nodeRef={contextMenuRef}
          in={showContextMenu && !!hydratedContextMenuData}
          timeout={200}
          classNames="context-menu"
          onEnter={() => {
            setContextMenuDisabled(false);
          }}
          onExited={() => {
            setContextMenuData({ x: 0, y: 0, data: null });
            setContextMenuDisabled(true);
          }}
        >
          <ContextMenu
            disabled={contextMenuDisabled}
            ref={contextMenuRef}
            x={contextMenuData.x}
            y={contextMenuData.y}
            context={hydratedContextMenuData!}
            onMenuItemSelected={contextMenuItemSelected}
          />
        </CSSTransition>
        {selectionBox && (
          <div
            className="selection-box"
            style={{
              left: selectionBox.width < 0 ? selectionBox.x + selectionBox.width : selectionBox.x,
              top: selectionBox.height < 0 ? selectionBox.y + selectionBox.height : selectionBox.y,
              width: Math.abs(selectionBox.width),
              height: Math.abs(selectionBox.height),
            }}
          />
        )}

        <WireLayer connections={connections} draggingWire={draggingWire} highlightedNodes={highlightedNodes} />
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
