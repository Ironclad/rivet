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
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { match } from 'ts-pattern';
import {
  type NodeInputDefinition,
  type ChartNode,
  type CommentNode,
  type NodeConnection,
  type NodeId,
  type PortId,
  type NodeOutputDefinition,
} from '@ironclad/rivet-core';
import type { HeightCache } from '../hooks/useNodeBodyHeight';
import { type ProcessDataForNode, lastRunData, selectedProcessPage } from '../state/dataFlow.js';
import { NodeBody } from './NodeBody.js';
import { NodeOutput } from './NodeOutput.js';
import SettingsCogIcon from 'majesticons/line/settings-cog-line.svg?react';
import SendIcon from 'majesticons/solid/send.svg?react';
import GitForkLine from 'majesticons/line/git-fork-line.svg?react';
import PinIcon from 'majesticons/line/pin-line.svg?react';
import PinSolidIcon from 'majesticons/solid/pin.svg?react';
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
} from '../state/graphBuilder';
import { Tooltip } from './Tooltip';

export type VisualNodeProps = {
  heightCache: HeightCache;
  node: ChartNode;
  connections?: NodeConnection[];
  xDelta?: number;
  yDelta?: number;
  isDragging?: boolean;
  isOverlay?: boolean;
  isSelected?: boolean;
  scale?: number;
  isKnownNodeType: boolean;
  isPinned: boolean;
  lastRun?: ProcessDataForNode[];
  processPage: number | 'latest';
  draggingWire?: DraggingWireDef;
  isZoomedOut: boolean;
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
        scale,
        isSelected,
        isKnownNodeType,
        isPinned,
        lastRun,
        processPage,
        isZoomedOut,
        onWireEndDrag,
        onWireStartDrag,
        onSelectNode,
        onStartEditing,
        onNodeSizeChanged,
        onMouseOver,
        onMouseOut,
        onPortMouseOver,
        onPortMouseOut,
      },
      ref,
    ) => {
      const isComment = node.type === 'comment';
      useDependsOnPlugins();

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
          transform: `translate(${node.visualData.x + xDelta}px, ${node.visualData.y + yDelta}px) scale(${scale ?? 1})`,
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
        scale,
        node.visualData.zIndex,
        isComment,
        asCommentNode.data.height,
      ]);

      const nodeRef = (refValue: HTMLDivElement | null) => {
        if (typeof ref === 'function') {
          ref(refValue);
        } else if (ref) {
          ref.current = refValue;
        }
      };

      // const isZoomedOut = !isComment && zoom < 0.4;

      const selectedProcessRun =
        lastRun && lastRun.length > 0
          ? lastRun?.at(processPage === 'latest' ? lastRun.length - 1 : processPage)?.data
          : undefined;

      return (
        <div
          className={clsx('node', {
            overlayNode: isOverlay,
            selected: isSelected,
            success: selectedProcessRun?.status?.type === 'ok',
            error: selectedProcessRun?.status?.type === 'error',
            running: selectedProcessRun?.status?.type === 'running',
            'not-ran': selectedProcessRun?.status?.type === 'notRan',
            zoomedOut: isZoomedOut,
            isComment,
            isPinned,
            disabled: node.disabled,
          })}
          ref={nodeRef}
          style={style}
          {...nodeAttributes}
          data-nodeid={node.id}
          data-contextmenutype={`node-${node.type}`}
          onMouseOver={(event) => onMouseOver?.(event, node.id)}
          onMouseOut={(event) => onMouseOut?.(event, node.id)}
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
  onSelectNode?: (multi: boolean) => void;
  onStartEditing?: () => void;
  onWireStartDrag?: (event: MouseEvent<HTMLElement>, startNodeId: NodeId, startPortId: PortId) => void;
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

    const draggingWire = useRecoilValue(draggingWireState);
    const closestPortToDraggingWire = useRecoilValue(draggingWireClosestPortState);

    return (
      <>
        <div className="node-title">
          <div className="grab-area" {...handleAttributes} onClick={handleGrabClick}>
            {node.isSplitRun ? <GitForkLine /> : <></>}
            <div className="title-text">{node.title}</div>
          </div>
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
        </div>

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

    const draggingWire = useRecoilValue(draggingWireState);
    const closestPortToDraggingWire = useRecoilValue(draggingWireClosestPortState);

    const setPinnedNodes = useSetRecoilState(pinnedNodesState);

    const togglePinned = useStableCallback(() => {
      setPinnedNodes((prev) => {
        if (prev.includes(node.id)) {
          return prev.filter((n) => n !== node.id);
        } else {
          return [...prev, node.id];
        }
      });
    });

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
          <NodeOutput node={node} />
        </ErrorBoundary>
        <div className="node-resize">
          <ResizeHandle onResizeStart={handleResizeStart} onResizeMove={handleResizeMove} />
        </div>
      </>
    );
  },
);

NormalVisualNodeContent.displayName = 'NormalVisualNodeContent';
