import clsx from 'clsx';
import {
  type CSSProperties,
  type FC,
  type HTMLAttributes,
  type MouseEvent,
  forwardRef,
  memo,
  useEffect,
  useState,
  useMemo,
} from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { match } from 'ts-pattern';
import {
  type NodeInputDefinition,
  type ChartNode,
  type CommentNode,
  type NodeConnection,
  type NodeId,
  type PortId,
  type NodeOutputDefinition,
  IF_PORT,
} from '@ironclad/rivet-core';
import type { HeightCache } from '../hooks/useNodeBodyHeight';
import { type ProcessDataForNode } from '../state/dataFlow.js';
import { NodeBody } from './NodeBody.js';
import { NodeOutput } from './NodeOutput.js';
import SettingsCogIcon from 'majesticons/line/settings-cog-line.svg?react';
import SendIcon from 'majesticons/solid/send.svg?react';
import GitForkLine from 'majesticons/line/git-fork-line.svg?react';
import PinIcon from 'majesticons/line/pin-line.svg?react';
import PinSolidIcon from 'majesticons/solid/pin.svg?react';
import BookIcon from 'majesticons/line/book-open-line.svg?react';
import { ResizeHandle } from './ResizeHandle.js';
import { useCanvasPositioning } from '../hooks/useCanvasPositioning.js';
import { useStableCallback } from '../hooks/useStableCallback.js';
import { LoadingSpinner } from './LoadingSpinner.js';
import { ErrorBoundary } from 'react-error-boundary';
import { NodePortsRenderer } from './NodePorts.js';
import { useDependsOnPlugins } from '../hooks/useDependsOnPlugins';
import {
  type DraggingWireDef,
  draggingWireClosestPortState,
  draggingWireState,
  isPinnedState,
  pinnedNodesState,
  viewingNodeChangesState,
} from '../state/graphBuilder';
import { Tooltip } from './Tooltip';
import { useHistoricalNodeChangeInfo } from '../hooks/useHistoricalNodeChangeInfo';
import { Port } from './Port';
import { preservePortTextCaseState } from '../state/settings';

export type VisualNodeProps = {
  heightCache: HeightCache;
  node: ChartNode;
  connections?: NodeConnection[];
  xDelta?: number;
  yDelta?: number;
  isDragging?: boolean;
  isOverlay?: boolean;
  isSelected?: boolean;
  isKnownNodeType: boolean;
  isPinned: boolean;
  lastRun?: ProcessDataForNode[];
  processPage: number | 'latest';
  draggingWire?: DraggingWireDef;
  isZoomedOut: boolean;
  isReallyZoomedOut: boolean;
  renderSkeleton?: boolean;
  onWireStartDrag?: (
    event: MouseEvent<HTMLElement>,
    startNodeId: NodeId,
    startPortId: PortId,
    isInput: boolean,
  ) => void;
  onWireEndDrag?: (event: MouseEvent<HTMLElement>, endNodeId: NodeId, endPortId: PortId) => void;
  onSelectNode?: (multi: boolean) => void;
  onStartEditing?: () => void;
  onNodeSizeChanged?: (newWidth: number, newHeight: number) => void;
  onMouseOver?: (event: MouseEvent<HTMLElement>, nodeId: NodeId) => void;
  onMouseOut?: (event: MouseEvent<HTMLElement>, nodeId: NodeId) => void;
  onPortMouseOver?: (
    event: MouseEvent<HTMLElement>,
    nodeId: NodeId,
    isInput: boolean,
    portId: PortId,
    definition: NodeInputDefinition | NodeOutputDefinition,
  ) => void;
  onPortMouseOut?: (
    event: MouseEvent<HTMLElement>,
    nodeId: NodeId,
    isInput: boolean,
    portId: PortId,
    definition: NodeInputDefinition | NodeOutputDefinition,
  ) => void;
  onResizeFinish?: (node: ChartNode, startWidth: number, startHeight: number) => void;

  nodeAttributes?: HTMLAttributes<HTMLDivElement>;
  handleAttributes?: HTMLAttributes<HTMLDivElement>;
};

export const VisualNode = memo(
  forwardRef<HTMLDivElement, VisualNodeProps>(
    (
      {
        heightCache,
        node,
        connections = [],
        handleAttributes,
        nodeAttributes,
        xDelta = 0,
        yDelta = 0,
        isDragging,
        isOverlay,
        isSelected,
        isKnownNodeType,
        isPinned,
        lastRun,
        processPage,
        isZoomedOut,
        isReallyZoomedOut,
        renderSkeleton,
        onWireEndDrag,
        onWireStartDrag,
        onSelectNode,
        onStartEditing,
        onNodeSizeChanged,
        onMouseOver,
        onMouseOut,
        onPortMouseOver,
        onPortMouseOut,
        onResizeFinish,
      },
      ref,
    ) => {
      const isComment = node.type === 'comment';
      useDependsOnPlugins();

      const changeInfo = useHistoricalNodeChangeInfo(node.id);

      const [isHovered, setIsHovered] = useState(false);

      const asCommentNode = node as CommentNode;
      const style = useMemo(() => {
        const bgColor = node.visualData.color?.bg ?? 'var(--grey-darkish)';
        const borderColor = node.visualData.color?.border ?? 'var(--grey-darkish)';

        let fgColor = 'var(--foreground-bright)';
        if (bgColor) {
          const match = bgColor.match(/node-color-(\d+)/);
          if (match?.[1]) {
            fgColor = `var(--node-color-${match[1]}-foreground)`;
          }
        }

        const style: CSSProperties = {
          opacity: isDragging ? '0' : '',
          transform: `translate(${node.visualData.x + xDelta}px, ${node.visualData.y + yDelta}px) scale(${1})`,
          zIndex: isComment ? -10000 : node.visualData.zIndex ?? 0,
          width: node.visualData.width,
          height: isComment ? asCommentNode.data.height : undefined,
          '--node-bg': bgColor,
          '--node-border': borderColor,
          '--node-bg-foreground': fgColor,
        } as CSSProperties;

        return style;
      }, [
        node.visualData.color?.bg,
        node.visualData.color?.border,
        node.visualData.x,
        node.visualData.y,
        xDelta,
        yDelta,
        node.visualData.width,
        isDragging,
        node.visualData.zIndex,
        isComment,
        asCommentNode.data.height,
      ]);

      if (renderSkeleton) {
        return <div className="node-skeleton" style={style} {...nodeAttributes} />;
      }

      const nodeRef = (refValue: HTMLDivElement | null) => {
        if (typeof ref === 'function') {
          ref(refValue);
        } else if (ref) {
          ref.current = refValue;
        }
      };

      const selectedProcessRun =
        lastRun && lastRun.length > 0
          ? lastRun?.at(processPage === 'latest' ? lastRun.length - 1 : processPage)?.data
          : undefined;

      const changedClass = changeInfo
        ? changeInfo.changed
          ? !changeInfo.before && changeInfo.after
            ? 'changed-added'
            : 'changed'
          : 'not-changed'
        : '';

      const isHistoricalChanged = changeInfo != null && changeInfo.changed && !!changeInfo.before && !!changeInfo.after;

      const handleMouseOver = (event: MouseEvent<HTMLElement>) => {
        onMouseOver?.(event, node.id);
        setIsHovered(true);
      };

      const handleMouseOut = (event: MouseEvent<HTMLElement>) => {
        onMouseOut?.(event, node.id);
        setIsHovered(false);
      };

      return (
        <div
          className={clsx(
            'node',
            {
              overlayNode: isOverlay,
              selected: isSelected,
              success: selectedProcessRun?.status?.type === 'ok',
              error: selectedProcessRun?.status?.type === 'error',
              running: selectedProcessRun?.status?.type === 'running',
              'not-ran': selectedProcessRun?.status?.type === 'notRan',
              zoomedOut: isZoomedOut,
              isComment,
              isPinned,
              isSplit: node.isSplitRun,
              disabled: node.disabled,
              conditional: !!node.isConditional,
            },
            changedClass,
          )}
          ref={nodeRef}
          style={style}
          {...nodeAttributes}
          data-nodeid={node.id}
          data-contextmenutype={`node-${node.type}`}
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
          onDoubleClick={() => {
            if (isKnownNodeType) {
              onStartEditing?.();
            }
          }}
        >
          {isZoomedOut ? (
            <ZoomedOutVisualNodeContent
              node={node}
              connections={connections}
              handleAttributes={handleAttributes}
              onSelectNode={onSelectNode}
              onStartEditing={onStartEditing}
              onPortMouseOver={onPortMouseOver}
              onPortMouseOut={onPortMouseOut}
              isKnownNodeType={isKnownNodeType}
              lastRun={lastRun}
              processPage={processPage}
              isReallyZoomedOut={isReallyZoomedOut}
            />
          ) : (
            <NormalVisualNodeContent
              heightCache={heightCache}
              node={node}
              connections={connections}
              onWireStartDrag={onWireStartDrag}
              onWireEndDrag={onWireEndDrag}
              onSelectNode={onSelectNode}
              onStartEditing={onStartEditing}
              onNodeSizeChanged={onNodeSizeChanged}
              handleAttributes={handleAttributes}
              onPortMouseOver={onPortMouseOver}
              onPortMouseOut={onPortMouseOut}
              isKnownNodeType={isKnownNodeType}
              lastRun={lastRun}
              processPage={processPage}
              isPinned={isPinned}
              isHistoricalChanged={isHistoricalChanged}
              onResizeFinish={onResizeFinish}
              isHovered={isHovered}
            />
          )}
        </div>
      );
    },
  ),
);

const ZoomedOutVisualNodeContent: FC<{
  node: ChartNode;
  connections?: NodeConnection[];
  handleAttributes?: HTMLAttributes<HTMLDivElement>;
  isKnownNodeType: boolean;
  lastRun?: ProcessDataForNode[];
  processPage: number | 'latest';
  isReallyZoomedOut: boolean;
  onSelectNode?: (multi: boolean) => void;
  onStartEditing?: () => void;
  onWireStartDrag?: (
    event: MouseEvent<HTMLElement>,
    startNodeId: NodeId,
    startPortId: PortId,
    isInput: boolean,
  ) => void;
  onWireEndDrag?: (event: MouseEvent<HTMLElement>, endNodeId: NodeId, endPortId: PortId) => void;
  onPortMouseOver?: (
    event: MouseEvent<HTMLElement>,
    nodeId: NodeId,
    isInput: boolean,
    portId: PortId,
    definition: NodeInputDefinition | NodeOutputDefinition,
  ) => void;
  onPortMouseOut?: (
    event: MouseEvent<HTMLElement>,
    nodeId: NodeId,
    isInput: boolean,
    portId: PortId,
    definition: NodeInputDefinition | NodeOutputDefinition,
  ) => void;
}> = memo(
  ({
    node,
    connections = [],
    handleAttributes,
    isKnownNodeType,
    lastRun,
    processPage,
    isReallyZoomedOut,
    onSelectNode,
    onStartEditing,
    onWireStartDrag,
    onWireEndDrag,
    onPortMouseOver,
    onPortMouseOut,
  }) => {
    useDependsOnPlugins();

    const handleEditClick = useStableCallback((event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onStartEditing?.();
    });

    const handleEditMouseDown = useStableCallback((event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      event.preventDefault();
    });

    const selectedProcessRun =
      lastRun && lastRun.length > 0
        ? lastRun?.at(processPage === 'latest' ? lastRun.length - 1 : processPage)?.data
        : undefined;

    const handleGrabClick = useStableCallback((event: MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      onSelectNode?.(event.shiftKey);
    });

    const draggingWire = useAtomValue(draggingWireState);
    const closestPortToDraggingWire = useAtomValue(draggingWireClosestPortState);

    const preservePortTextCase = useAtomValue(preservePortTextCaseState);

    const handleIfPortMouseDown = useStableCallback(
      (event: MouseEvent<HTMLDivElement>, port: PortId, isInput: boolean) => {
        event.stopPropagation();
        event.preventDefault();
        onWireStartDrag?.(event, node.id, port, isInput);
      },
    );

    const handleIfPortMouseUp = useStableCallback((event: MouseEvent<HTMLDivElement>, port: PortId) => {
      onWireEndDrag?.(event, node.id, port);
    });

    const ifConnected =
      connections.some((conn) => conn.inputNodeId === node.id && conn.inputId === IF_PORT.id) ||
      (draggingWire?.endNodeId === node.id && draggingWire?.endPortId === IF_PORT.id);

    return (
      <>
        <div className="node-title">
          {!isReallyZoomedOut && (
            <div className="grab-area" {...handleAttributes} onClick={handleGrabClick}>
              {node.isSplitRun ? <GitForkLine /> : <></>}
              <div className="title-text">{node.title}</div>
            </div>
          )}
          {!isReallyZoomedOut && (
            <div className="title-controls">
              <div className="last-run-status">
                {selectedProcessRun?.status ? (
                  match(selectedProcessRun.status)
                    .with({ type: 'ok' }, () => (
                      <div className="success">
                        <SendIcon />
                      </div>
                    ))
                    .with({ type: 'error' }, () => (
                      <div className="error">
                        <SendIcon />
                      </div>
                    ))
                    .with({ type: 'running' }, () => (
                      <div className="running">
                        <LoadingSpinner />
                      </div>
                    ))
                    .with({ type: 'interrupted' }, () => (
                      <div className="interrupted">
                        <SendIcon />
                      </div>
                    ))
                    .with({ type: 'notRan' }, () => (
                      <div className="not-ran">
                        <SendIcon />
                      </div>
                    ))
                    .exhaustive()
                ) : (
                  <></>
                )}
              </div>
              <button className="edit-button" onClick={handleEditClick} onMouseDown={handleEditMouseDown} title="Edit">
                <SettingsCogIcon />
              </button>
            </div>
          )}
        </div>

        {node.isConditional && (
          <div className="node-title-ports input-ports">
            <Port
              connected={ifConnected}
              canDragTo={draggingWire ? !draggingWire.startPortIsInput : false}
              closest={closestPortToDraggingWire?.nodeId === node.id && closestPortToDraggingWire.portId === IF_PORT.id}
              id={`$if` as PortId}
              definition={IF_PORT}
              nodeId={node.id}
              title="if"
              input
              preservePortCase={preservePortTextCase}
              onMouseOver={onPortMouseOver}
              onMouseOut={onPortMouseOut}
              onMouseDown={handleIfPortMouseDown}
              onMouseUp={handleIfPortMouseUp}
            />
          </div>
        )}

        {isKnownNodeType && (
          <NodePortsRenderer
            node={node}
            connections={connections}
            zoomedOut
            onWireStartDrag={onWireStartDrag}
            onWireEndDrag={onWireEndDrag}
            draggingWire={draggingWire}
            closestPortToDraggingWire={closestPortToDraggingWire}
            onPortMouseOver={onPortMouseOver}
            onPortMouseOut={onPortMouseOut}
          />
        )}
      </>
    );
  },
);

ZoomedOutVisualNodeContent.displayName = 'ZoomedOutVisualNodeContent';

const NormalVisualNodeContent: FC<{
  heightCache: HeightCache;
  node: ChartNode;
  connections?: NodeConnection[];
  handleAttributes?: HTMLAttributes<HTMLDivElement>;
  isKnownNodeType: boolean;
  lastRun?: ProcessDataForNode[];
  processPage: number | 'latest';
  isPinned: boolean;
  isHistoricalChanged: boolean;
  isHovered: boolean;
  onWireStartDrag?: (
    event: MouseEvent<HTMLElement>,
    startNodeId: NodeId,
    startPortId: PortId,
    isInput: boolean,
  ) => void;
  onWireEndDrag?: (event: MouseEvent<HTMLElement>, endNodeId: NodeId, endPortId: PortId) => void;
  onSelectNode?: (multi: boolean) => void;
  onStartEditing?: () => void;
  onNodeSizeChanged?: (newWidth: number, newHeight: number) => void;
  onPortMouseOver?: (
    event: MouseEvent<HTMLElement>,
    nodeId: NodeId,
    isInput: boolean,
    portId: PortId,
    definition: NodeInputDefinition | NodeOutputDefinition,
  ) => void;
  onPortMouseOut?: (
    event: MouseEvent<HTMLElement>,
    nodeId: NodeId,
    isInput: boolean,
    portId: PortId,
    definition: NodeInputDefinition | NodeOutputDefinition,
  ) => void;
  onResizeFinish?: (node: ChartNode, startWidth: number, startHeight: number) => void;
}> = memo(
  ({
    heightCache,
    node,
    connections = [],
    lastRun,
    processPage,
    isPinned,
    onWireStartDrag,
    onWireEndDrag,
    onSelectNode,
    onStartEditing,
    onNodeSizeChanged,
    handleAttributes,
    onPortMouseOver,
    onPortMouseOut,
    isKnownNodeType,
    isHistoricalChanged,
    onResizeFinish,
    isHovered,
  }) => {
    useDependsOnPlugins();

    const [initialHeight, setInitialHeight] = useState<number | undefined>();
    const [initialWidth, setInitialWidth] = useState<number | undefined>();
    const [initialMouseX, setInitialMouseX] = useState(0);
    const [initialMouseY, setInitialMouseY] = useState(0);
    const { clientToCanvasPosition } = useCanvasPositioning();

    const getNodeCurrentDimensions = (elementOrChild: HTMLElement): [number, number] => {
      const nodeElement = elementOrChild.closest('.node');
      if (!nodeElement) {
        return [100, 100];
      }
      const cssWidth = window.getComputedStyle(nodeElement).width;
      const cssHeight = window.getComputedStyle(nodeElement).height;

      return [parseInt(cssWidth, 10), parseInt(cssHeight, 10)];
    };

    const handleEditClick = useStableCallback((event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onStartEditing?.();
    });

    const handleEditMouseDown = useStableCallback((event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      event.preventDefault();
    });

    const handleResizeStart = useStableCallback((event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const [initialWidth, initialHeight] = getNodeCurrentDimensions(event.target as HTMLElement);

      setInitialWidth(initialWidth);
      setInitialHeight(initialHeight);
      setInitialMouseX(event.clientX);
      setInitialMouseY(event.clientY);
    });

    const handleResizeMove = useStableCallback((event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const initialMousePositionCanvas = clientToCanvasPosition(initialMouseX, initialMouseY);
      const newMousePositionCanvas = clientToCanvasPosition(event.clientX, event.clientY);

      const deltaX = newMousePositionCanvas.x - initialMousePositionCanvas.x;
      const deltaY = newMousePositionCanvas.y - initialMousePositionCanvas.y;

      let newWidth = initialWidth;
      let newHeight = initialHeight;

      if (initialWidth != null) {
        newWidth = initialWidth + deltaX;
      }

      if (initialHeight != null) {
        newHeight = initialHeight + deltaY;
      }

      if (newWidth != null && newHeight != null && (newWidth !== initialWidth || newHeight !== initialHeight)) {
        onNodeSizeChanged?.(newWidth, newHeight);
      }
    });

    const handleResizeEnd = useStableCallback((event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      onResizeFinish?.(node, initialWidth ?? 200, initialHeight ?? 200);

      setInitialWidth(undefined);
      setInitialHeight(undefined);
      setInitialMouseX(0);
      setInitialMouseY(0);
    });

    const selectedProcessRun =
      lastRun && lastRun.length > 0
        ? lastRun?.at(processPage === 'latest' ? lastRun.length - 1 : processPage)?.data
        : undefined;

    const [shiftHeld, setShiftHeld] = useState(false);

    const watchShift = useStableCallback((event: MouseEvent) => {
      if (event.shiftKey !== shiftHeld) {
        setShiftHeld(event.shiftKey);
      }
    });

    const handleAttributesMaybe = shiftHeld ? {} : handleAttributes;

    const handleGrabClick = useStableCallback((event: MouseEvent) => {
      event.stopPropagation();
      onSelectNode?.(event.shiftKey);
    });

    const draggingWire = useAtomValue(draggingWireState);
    const closestPortToDraggingWire = useAtomValue(draggingWireClosestPortState);

    const setPinnedNodes = useSetAtom(pinnedNodesState);

    const togglePinned = useStableCallback(() => {
      setPinnedNodes((prev) => {
        if (prev.includes(node.id)) {
          return prev.filter((n) => n !== node.id);
        } else {
          return [...prev, node.id];
        }
      });
    });

    const setViewingNodeChanges = useSetAtom(viewingNodeChangesState);

    const viewChanges = () => {
      if (!isHistoricalChanged) {
        return;
      }

      setViewingNodeChanges(node.id);
    };

    const preservePortTextCase = useAtomValue(preservePortTextCaseState);

    const handleIfPortMouseDown = useStableCallback(
      (event: MouseEvent<HTMLDivElement>, port: PortId, isInput: boolean) => {
        event.stopPropagation();
        event.preventDefault();
        onWireStartDrag?.(event, node.id, port, isInput);
      },
    );

    const handleIfPortMouseUp = useStableCallback((event: MouseEvent<HTMLDivElement>, port: PortId) => {
      onWireEndDrag?.(event, node.id, port);
    });

    const ifConnected =
      connections.some((conn) => conn.inputNodeId === node.id && conn.inputId === IF_PORT.id) ||
      (draggingWire?.endNodeId === node.id && draggingWire?.endPortId === IF_PORT.id);

    return (
      <>
        <div className="node-title" onMouseMove={watchShift}>
          <div
            className={clsx('grab-area', { grabbable: !shiftHeld })}
            {...handleAttributesMaybe}
            onClick={handleGrabClick}
          >
            {node.isSplitRun ? <GitForkLine /> : <></>}
            <div className="title-text">{node.title}</div>
          </div>
          <div className="title-controls">
            {isHistoricalChanged && (
              <button onClick={viewChanges} className="changed-button">
                <Tooltip content="This node was changed, click to view changes">
                  <BookIcon />
                </Tooltip>
              </button>
            )}
            <button className={clsx('pin-button', { pinned: isPinned })} onClick={togglePinned}>
              <Tooltip content="Pin node (always show entire output)">
                {isPinned ? <PinSolidIcon /> : <PinIcon />}
              </Tooltip>
            </button>
            <div className="last-run-status">
              {selectedProcessRun?.status ? (
                match(selectedProcessRun.status)
                  .with({ type: 'ok' }, () => (
                    <Tooltip content="This node ran successfully">
                      <div className="success">
                        <SendIcon />
                      </div>
                    </Tooltip>
                  ))
                  .with({ type: 'error' }, () => (
                    <Tooltip content="This node errored">
                      <div className="error">
                        <SendIcon />
                      </div>
                    </Tooltip>
                  ))
                  .with({ type: 'running' }, () => (
                    <Tooltip content="This node is currently running">
                      <div className="running">
                        <LoadingSpinner />
                      </div>
                    </Tooltip>
                  ))
                  .with({ type: 'interrupted' }, () => (
                    <Tooltip content="This node was interrupted">
                      <div className="interrupted">
                        <SendIcon />
                      </div>
                    </Tooltip>
                  ))
                  .with({ type: 'notRan' }, () => (
                    <Tooltip content="This node was not ran due to control flow">
                      <div className="not-ran">
                        <SendIcon />
                      </div>
                    </Tooltip>
                  ))
                  .exhaustive()
              ) : (
                <></>
              )}
            </div>
            <Tooltip content="Edit Node">
              <button
                className="edit-button"
                onClick={(e) => {
                  if (isKnownNodeType) {
                    handleEditClick(e);
                  }
                }}
                onMouseDown={handleEditMouseDown}
              >
                <SettingsCogIcon />
              </button>
            </Tooltip>
          </div>
        </div>

        {node.isConditional && (
          <div className="node-title-ports input-ports">
            <Port
              connected={ifConnected}
              canDragTo={draggingWire ? !draggingWire.startPortIsInput : false}
              closest={closestPortToDraggingWire?.nodeId === node.id && closestPortToDraggingWire.portId === IF_PORT.id}
              id={`$if` as PortId}
              definition={IF_PORT}
              nodeId={node.id}
              title="if"
              input
              preservePortCase={preservePortTextCase}
              onMouseOver={onPortMouseOver}
              onMouseOut={onPortMouseOut}
              onMouseDown={handleIfPortMouseDown}
              onMouseUp={handleIfPortMouseUp}
            />
          </div>
        )}

        <ErrorBoundary fallback={<div>Error rendering node body</div>}>
          {isKnownNodeType ? (
            <NodeBody heightCache={heightCache} node={node} />
          ) : (
            <div>Unknown node type {node.type} - are you missing a plugin?</div>
          )}
        </ErrorBoundary>

        {isKnownNodeType && (
          <NodePortsRenderer
            node={node}
            connections={connections}
            onWireStartDrag={onWireStartDrag}
            onWireEndDrag={onWireEndDrag}
            draggingWire={draggingWire}
            closestPortToDraggingWire={closestPortToDraggingWire}
            onPortMouseOver={onPortMouseOver}
            onPortMouseOut={onPortMouseOut}
          />
        )}

        <ErrorBoundary fallback={<div>Error rendering node output</div>}>
          <NodeOutput node={node} isHovered={isHovered} />
        </ErrorBoundary>
        <div className="node-resize">
          <ResizeHandle
            onResizeStart={handleResizeStart}
            onResizeMove={handleResizeMove}
            onResizeEnd={handleResizeEnd}
          />
        </div>
      </>
    );
  },
);

NormalVisualNodeContent.displayName = 'NormalVisualNodeContent';
