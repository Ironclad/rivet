import { NodeId, PortId } from '@ironclad/rivet-core';
import { FC, useRef, useLayoutEffect, MouseEvent } from 'react';
import { useCanvasPositioning } from '../hooks/useCanvasPositioning';
import { nodePortCache, nodePortPositionCache } from './VisualNode';
import clsx from 'clsx';
import { useRecoilValue } from 'recoil';
import { draggingWireClosestPortState, draggingWireState } from '../state/graphBuilder';

export const Port: FC<{
  input?: boolean;
  title: string;
  nodeId: NodeId;
  id: PortId;
  connected?: boolean;
  onMouseDown?: (event: MouseEvent<HTMLDivElement>, port: PortId, isInput: boolean) => void;
  onMouseUp?: (event: MouseEvent<HTMLDivElement>, port: PortId) => void;
}> = ({ input = false, title, nodeId, id, connected, onMouseDown, onMouseUp }) => {
  const { clientToCanvasPosition } = useCanvasPositioning();
  const ref = useRef<HTMLDivElement>(null);

  const draggingWire = useRecoilValue(draggingWireState);
  const closestPortToDraggingWire = useRecoilValue(draggingWireClosestPortState);

  useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }

    nodePortCache[nodeId] ??= {};
    nodePortCache[nodeId]![id] = ref.current;

    const rect = ref.current.getBoundingClientRect();
    const canvasPosition = clientToCanvasPosition(rect.x + rect.width / 2, rect.y + rect.height / 2);

    nodePortPositionCache[nodeId] ??= {};
    nodePortPositionCache[nodeId]![id] = {
      x: canvasPosition.x,
      y: canvasPosition.y,
    };
  });

  const canDragTo = draggingWire ? draggingWire.startPortIsInput !== input : false;

  return (
    <div
      key={id}
      className={clsx('port', {
        connected,
        closest: closestPortToDraggingWire?.nodeId === nodeId && closestPortToDraggingWire.portId === id,
      })}
    >
      <div
        ref={ref}
        className={clsx('port-circle', { 'input-port': input, 'output-port': !input })}
        onMouseDown={(e) => {
          return onMouseDown?.(e, id, input);
        }}
        onMouseUp={(e) => onMouseUp?.(e, id)}
        data-portid={id}
        data-nodeid={nodeId}
      >
        {canDragTo && <div className={clsx('port-hover-area')} />}
      </div>
      <div className="port-label">{title}</div>
    </div>
  );
};
