import clsx from 'clsx';
import { CSSProperties, FC, HTMLAttributes, MouseEvent, forwardRef, memo, useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { match } from 'ts-pattern';
import { ChartNode, NodeConnection, NodeId, PortId } from '@ironclad/nodai-core';
import { lastRunData } from '../state/dataFlow';
import { NodeBody } from './NodeBody';
import { NodeOutput } from './NodeOutput';
import { ReactComponent as SettingsCogIcon } from 'majesticons/line/settings-cog-line.svg';
import { ReactComponent as SendIcon } from 'majesticons/solid/send.svg';
import { ReactComponent as GitForkLine } from 'majesticons/line/git-fork-line.svg';
import { ResizeHandle } from './ResizeHandle';
import { useCanvasPositioning } from '../hooks/useCanvasPositioning';
import { useGetNodeIO } from '../hooks/useGetNodeIO';
import { useStableCallback } from '../hooks/useStableCallback';
import { LoadingSpinner } from './LoadingSpinner';

export type VisualNodeProps = {
  node: ChartNode;
  connections?: NodeConnection[];
  xDelta?: number;
  yDelta?: number;
  isDragging?: boolean;
  isOverlay?: boolean;
  isSelected?: boolean;
  scale?: number;
  onWireStartDrag?: (event: MouseEvent<HTMLElement>, startNodeId: NodeId, startPortId: PortId) => void;
  onWireEndDrag?: (event: MouseEvent<HTMLElement>, endNodeId: NodeId, endPortId: PortId) => void;
  onSelectNode?: () => void;
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
        onNodeWidthChanged,
        onMouseOver,
        onMouseOut,
      },
      ref,
    ) => {
      const lastRun = useRecoilValue(lastRunData(node.id));
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

      const isZoomedOut = zoom < 0;

      return (
        <div
          className={clsx('node', {
            overlayNode: isOverlay,
            selected: isSelected,
            success: lastRun?.status?.type === 'ok',
            error: lastRun?.status?.type === 'error',
            running: lastRun?.status?.type === 'running',
            zoomedOut: isZoomedOut,
          })}
          ref={nodeRef}
          style={style}
          {...nodeAttributes}
          data-node-id={node.id}
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
            />
          ) : (
            <NormalVisualNodeContent
              node={node}
              connections={connections}
              onWireStartDrag={onWireStartDrag}
              onWireEndDrag={onWireEndDrag}
              onSelectNode={onSelectNode}
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
  onSelectNode?: () => void;
  onWireStartDrag?: (event: MouseEvent<HTMLElement>, startNodeId: NodeId, startPortId: PortId) => void;
  onWireEndDrag?: (event: MouseEvent<HTMLElement>, endNodeId: NodeId, endPortId: PortId) => void;
}> = memo(({ node, connections = [], handleAttributes, onSelectNode, onWireStartDrag, onWireEndDrag }) => {
  const lastRun = useRecoilValue(lastRunData(node.id));

  const handleEditClick = useStableCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onSelectNode?.();
  });

  const handleEditMouseDown = useStableCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
  });

  return (
    <>
      <div className="node-title">
        <div className="grab-area" {...handleAttributes}>
          {node.isSplitRun ? <GitForkLine /> : <></>}
          <div className="title-text">{node.title}</div>
        </div>
        <div className="title-controls">
          <div className="last-run-status">
            {lastRun?.status ? (
              match(lastRun.status)
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
});

const NormalVisualNodeContent: FC<{
  node: ChartNode;
  connections?: NodeConnection[];
  handleAttributes?: HTMLAttributes<HTMLDivElement>;
  onWireStartDrag?: (event: MouseEvent<HTMLElement>, startNodeId: NodeId, startPortId: PortId) => void;
  onWireEndDrag?: (event: MouseEvent<HTMLElement>, endNodeId: NodeId, endPortId: PortId) => void;
  onSelectNode?: () => void;
  onNodeWidthChanged?: (newWidth: number) => void;
}> = memo(
  ({ node, connections = [], onWireStartDrag, onWireEndDrag, onSelectNode, onNodeWidthChanged, handleAttributes }) => {
    const lastRun = useRecoilValue(lastRunData(node.id));

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
      onSelectNode?.();
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

    return (
      <>
        <div className="node-title">
          <div className="grab-area" {...handleAttributes}>
            {node.isSplitRun ? <GitForkLine /> : <></>}
            <div className="title-text">{node.title}</div>
          </div>
          <div className="title-controls">
            <div className="last-run-status">
              {lastRun?.status ? (
                match(lastRun.status)
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
        <NodeBody node={node} />
        <NodePorts
          node={node}
          connections={connections}
          onWireStartDrag={onWireStartDrag}
          onWireEndDrag={onWireEndDrag}
        />
        <NodeOutput node={node} />
        <div className="node-resize">
          <ResizeHandle onResizeStart={handleResizeStart} onResizeMove={handleResizeMove} />
        </div>
      </>
    );
  },
);

const NodePorts: FC<{
  node: ChartNode;
  connections: NodeConnection[];
  zoomedOut?: boolean;
  onWireStartDrag?: (event: MouseEvent<HTMLElement>, startNodeId: NodeId, startPortId: PortId) => void;
  onWireEndDrag?: (event: MouseEvent<HTMLElement>, endNodeId: NodeId, endPortId: PortId) => void;
}> = memo(({ node, connections, zoomedOut, onWireStartDrag, onWireEndDrag }) => {
  const getIO = useGetNodeIO();
  const { inputDefinitions, outputDefinitions } = getIO(node);
  const { clientToCanvasPosition } = useCanvasPositioning();

  const handlePortMouseDown = useStableCallback((event: MouseEvent<HTMLDivElement>, port: PortId) => {
    event.stopPropagation();
    event.preventDefault();
    onWireStartDrag?.(event, node.id, port);
  });

  const handlePortMouseUp = useStableCallback((event: MouseEvent<HTMLDivElement>, port: PortId) => {
    event.stopPropagation();
    event.preventDefault();
    onWireEndDrag?.(event, node.id, port);
  });

  return (
    <div className="node-ports">
      <div className="input-ports">
        {inputDefinitions.map((input) => {
          const connected = connections.some((conn) => conn.inputNodeId === node.id && conn.inputId === input.id);
          return (
            <div key={input.id} className={clsx('port', { connected })}>
              <div
                ref={(elem) => {
                  if (elem) {
                    nodePortCache[node.id] ??= {};
                    nodePortCache[node.id]![input.id] = elem;

                    const rect = elem.getBoundingClientRect();
                    const canvasPosition = clientToCanvasPosition(rect.x + rect.width / 2, rect.y + rect.height / 2);

                    nodePortPositionCache[node.id] ??= {};
                    nodePortPositionCache[node.id]![input.id] = {
                      x: canvasPosition.x,
                      y: canvasPosition.y,
                    };
                  }
                }}
                className="port-circle input-port"
                onMouseDown={(e) => handlePortMouseDown(e, input.id)}
                onMouseUp={(e) => handlePortMouseUp(e, input.id)}
                data-port-id={input.id}
              />
              <div className="port-label">{input.title}</div>
            </div>
          );
        })}
      </div>
      <div className="output-ports">
        {outputDefinitions.map((output) => {
          const connected = connections.some((conn) => conn.outputNodeId === node.id && conn.outputId === output.id);
          return (
            <div key={output.id} className={clsx('port', { connected })}>
              <div
                ref={(elem) => {
                  if (elem) {
                    nodePortCache[node.id] ??= {};
                    nodePortCache[node.id]![output.id] = elem;

                    const rect = elem.getBoundingClientRect();
                    const canvasPosition = clientToCanvasPosition(rect.x + rect.width / 2, rect.y + rect.height / 2);

                    nodePortPositionCache[node.id] ??= {};
                    nodePortPositionCache[node.id]![output.id] = {
                      x: canvasPosition.x,
                      y: canvasPosition.y,
                    };
                  }
                }}
                className="port-circle output-port"
                onMouseDown={(e) => handlePortMouseDown(e, output.id)}
                onMouseUp={(e) => handlePortMouseUp(e, output.id)}
                data-port-id={output.id}
              />
              <div className="port-label">{output.title}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
