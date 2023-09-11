import { NodeId, PortId } from '@ironclad/rivet-core';
import { FC, useRef, MouseEvent, memo } from 'react';
import clsx from 'clsx';

export const Port: FC<{
  input?: boolean;
  title: string;
  nodeId: NodeId;
  id: PortId;
  connected?: boolean;
  canDragTo: boolean;
  closest: boolean;
  onMouseDown?: (event: MouseEvent<HTMLDivElement>, port: PortId, isInput: boolean) => void;
  onMouseUp?: (event: MouseEvent<HTMLDivElement>, port: PortId) => void;
}> = memo(({ input = false, title, nodeId, id, connected, canDragTo, closest, onMouseDown, onMouseUp }) => {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      key={id}
      className={clsx('port', {
        connected,
        closest,
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
});
