import clsx from 'clsx';
import { CSSProperties, FC, HTMLAttributes, MouseEvent, forwardRef, memo, useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { match } from 'ts-pattern';
import { ChartNode, NodeConnection, NodeId, PortId } from '@ironclad/rivet-core';
import { lastRunData, selectedProcessPage } from '../state/dataFlow.js';
import { NodeBody } from './NodeBody.js';
import { NodeOutput } from './NodeOutput.js';
import { ReactComponent as SettingsCogIcon } from 'majesticons/line/settings-cog-line.svg';
import { ReactComponent as SendIcon } from 'majesticons/solid/send.svg';
import { ReactComponent as GitForkLine } from 'majesticons/line/git-fork-line.svg';
import { ResizeHandle } from './ResizeHandle.js';
import { useCanvasPositioning } from '../hooks/useCanvasPositioning.js';
import { useStableCallback } from '../hooks/useStableCallback.js';
import { LoadingSpinner } from './LoadingSpinner.js';
import { ErrorBoundary } from 'react-error-boundary';
import { NodePorts } from './NodePorts.js';

export type VisualNodeProps = {
  node: ChartNode;
  connections?: NodeConnection[];
  xDelta?: number;
  yDelta?: number;
  isDragging?: boolean;
  isOverlay?: boolean;
  isSelected?: boolean;
  scale?: number;
  onWireStartDrag?: (
    event: MouseEvent<HTMLElement>,
    startNodeId: NodeId,
    startPortId: PortId,
    isInput: boolean,
  ) => void;
  onWireEndDrag?: (event: MouseEvent<HTMLElement>, endNodeId: NodeId, endPortId: PortId) => void;
  onSelectNode?: (multi: boolean) => void;
  onStartEditing?: () => void;
  onNodeWidthChanged?: (newWidth: number) => void;
  onMouseOver?: (event: MouseEvent<HTMLElement>, nodeId: NodeId) => void;
  onMouseOut?: (event: MouseEvent<HTMLElement>, nodeId: NodeId) => void;

  nodeAttributes?: HTMLAttributes<HTMLDivElement>;
  handleAttributes?: HTMLAttributes<HTMLDivElement>;
};

export const nodeElementCache: Record<NodeId, HTMLDivElement | null> = {};

export const nodePortCache: Record<NodeId, Record<PortId, HTMLDivElement | null>> = {};

export const nodePortPositionCache: Record<NodeId, Record<PortId, { x: number; y: number }>> = {};

export const VisualNode = memo(
  forwardRef<HTMLDivElement, VisualNodeProps>(
    (
      {
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
        onWireEndDrag,
        onWireStartDrag,
        onSelectNode,
        onStartEditing,
        onNodeWidthChanged,
        onMouseOver,
        onMouseOut,
      },
      ref,
    ) => {
      const lastRun = useRecoilValue(lastRunData(node.id));
      const processPage = useRecoilValue(selectedProcessPage(node.id));

      const {
        canvasPosition: { zoom },
      } = useCanvasPositioning();

      const style: CSSProperties = {
        opacity: isDragging ? '0' : '',
        transform: `translate(${node.visualData.x + xDelta}px, ${node.visualData.y + yDelta}px) scale(${scale ?? 1})`,
        zIndex: node.visualData.zIndex ?? 0,
        width: node.visualData.width,
      };

      const nodeRef = (refValue: HTMLDivElement | null) => {
        if (typeof ref === 'function') {
          ref(refValue);
        } else if (ref) {
          ref.current = refValue;
        }

        nodeElementCache[node.id] = refValue!;
      };

      useEffect(() => {
        const nodeId = node.id;

        return () => {
          nodeElementCache[nodeId] = null;
          nodePortCache[nodeId] = {};
        };
      }, [node.id]);

      const isZoomedOut = zoom < 0.4;

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
            zoomedOut: isZoomedOut,
          })}
          ref={nodeRef}
          style={style}
          {...nodeAttributes}
          data-nodeid={node.id}
          data-contextmenutype={`node-${node.type}`}
          onMouseOver={(event) => onMouseOver?.(event, node.id)}
          onMouseOut={(event) => onMouseOut?.(event, node.id)}
        >
          {isZoomedOut ? (
            <ZoomedOutVisualNodeContent
              node={node}
              connections={connections}
              handleAttributes={handleAttributes}
              onSelectNode={onSelectNode}
              onStartEditing={onStartEditing}
            />
          ) : (
            <NormalVisualNodeContent
              node={node}
              connections={connections}
              onWireStartDrag={onWireStartDrag}
              onWireEndDrag={onWireEndDrag}
              onSelectNode={onSelectNode}
              onStartEditing={onStartEditing}
              onNodeWidthChanged={onNodeWidthChanged}
              handleAttributes={handleAttributes}
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
  onSelectNode?: (multi: boolean) => void;
  onStartEditing?: () => void;
  onWireStartDrag?: (event: MouseEvent<HTMLElement>, startNodeId: NodeId, startPortId: PortId) => void;
  onWireEndDrag?: (event: MouseEvent<HTMLElement>, endNodeId: NodeId, endPortId: PortId) => void;
}> = memo(
  ({ node, connections = [], handleAttributes, onSelectNode, onStartEditing, onWireStartDrag, onWireEndDrag }) => {
    const lastRun = useRecoilValue(lastRunData(node.id));
    const processPage = useRecoilValue(selectedProcessPage(node.id));

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
        <NodePorts
          node={node}
          connections={connections}
          zoomedOut
          onWireStartDrag={onWireStartDrag}
          onWireEndDrag={onWireEndDrag}
        />
      </>
    );
  },
);

const NormalVisualNodeContent: FC<{
  node: ChartNode;
  connections?: NodeConnection[];
  handleAttributes?: HTMLAttributes<HTMLDivElement>;
  onWireStartDrag?: (
    event: MouseEvent<HTMLElement>,
    startNodeId: NodeId,
    startPortId: PortId,
    isInput: boolean,
  ) => void;
  onWireEndDrag?: (event: MouseEvent<HTMLElement>, endNodeId: NodeId, endPortId: PortId) => void;
  onSelectNode?: (multi: boolean) => void;
  onStartEditing?: () => void;
  onNodeWidthChanged?: (newWidth: number) => void;
}> = memo(
  ({
    node,
    connections = [],
    onWireStartDrag,
    onWireEndDrag,
    onSelectNode,
    onStartEditing,
    onNodeWidthChanged,
    handleAttributes,
  }) => {
    const lastRun = useRecoilValue(lastRunData(node.id));
    const processPage = useRecoilValue(selectedProcessPage(node.id));

    const [initialWidth, setInitialWidth] = useState<number | undefined>();
    const [initialMouseX, setInitialMouseX] = useState(0);
    const { clientToCanvasPosition } = useCanvasPositioning();

    const getNodeCurrentWidth = (elementOrChild: HTMLElement): number => {
      const nodeElement = elementOrChild.closest('.node');
      if (!nodeElement) {
        return 100;
      }
      const cssWidth = window.getComputedStyle(nodeElement).width;
      return parseInt(cssWidth, 10);
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

      setInitialWidth(getNodeCurrentWidth(event.target as HTMLElement));
      setInitialMouseX(event.clientX);
    });

    const handleResizeMove = useStableCallback((event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const initialMousePositionCanvas = clientToCanvasPosition(initialMouseX, 0);
      const newMousePositionCanvas = clientToCanvasPosition(event.clientX, 0);

      const delta = newMousePositionCanvas.x - initialMousePositionCanvas.x;

      if (initialWidth) {
        const newWidth = initialWidth + delta;
        onNodeWidthChanged?.(newWidth);
      }
    });

    const selectedProcessRun =
      lastRun && lastRun.length > 0
        ? lastRun?.at(processPage === 'latest' ? lastRun.length - 1 : processPage)?.data
        : undefined;

    const [shiftHeld, setShiftHeld] = useState(false);

    const watchShift = useStableCallback((event: MouseEvent) => {
      setShiftHeld(event.shiftKey);
    });

    const handleAttributesMaybe = shiftHeld ? {} : handleAttributes;

    const handleGrabClick = useStableCallback((event: MouseEvent) => {
      event.stopPropagation();
      onSelectNode?.(event.shiftKey);
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
        <ErrorBoundary fallback={<div>Error rendering node body</div>}>
          <NodeBody node={node} />
        </ErrorBoundary>
        <ErrorBoundary fallback={<></>}>
          <NodePorts
            node={node}
            connections={connections}
            onWireStartDrag={onWireStartDrag}
            onWireEndDrag={onWireEndDrag}
          />
        </ErrorBoundary>

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
