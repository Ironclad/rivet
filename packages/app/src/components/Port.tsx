import { type NodeInputDefinition, type NodeId, type PortId, type NodeOutputDefinition } from '@ironclad/rivet-core';
import { type FC, useRef, type MouseEvent, memo } from 'react';
import clsx from 'clsx';
import { useStableCallback } from '../hooks/useStableCallback';

export const Port: FC<{
  input?: boolean;
  title: string;
  nodeId: NodeId;
  id: PortId;
  connected?: boolean;
  canDragTo: boolean;
  closest: boolean;
  definition: NodeInputDefinition | NodeOutputDefinition;
  onMouseDown?: (event: MouseEvent<HTMLDivElement>, port: PortId, isInput: boolean) => void;
  onMouseUp?: (event: MouseEvent<HTMLDivElement>, port: PortId) => void;
  onMouseOver?: (
    event: MouseEvent<HTMLDivElement>,
    nodeId: NodeId,
    isInput: boolean,
    portId: PortId,
    definition: NodeInputDefinition | NodeOutputDefinition,
  ) => void;
  onMouseOut?: (
    event: MouseEvent<HTMLDivElement>,
    nodeId: NodeId,
    isInput: boolean,
    portId: PortId,
    definition: NodeInputDefinition | NodeOutputDefinition,
  ) => void;
}> = memo(
  ({
    input = false,
    title,
    nodeId,
    id,
    connected,
    canDragTo,
    closest,
    definition,
    onMouseDown,
    onMouseUp,
    onMouseOver,
    onMouseOut,
  }) => {
    const ref = useRef<HTMLDivElement>(null);

    const handleMouseOver = useStableCallback((event: MouseEvent<HTMLDivElement>) => {
      onMouseOver?.(event, nodeId, input, id, definition);
    });

    const handleMouseOut = useStableCallback((event: MouseEvent<HTMLDivElement>) => {
      onMouseOut?.(event, nodeId, input, id, definition);
    });

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
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
          data-portid={id}
          data-porttype={input ? 'input' : 'output'}
          data-nodeid={nodeId}
        >
          {canDragTo && <div className={clsx('port-hover-area')} />}
        </div>
        <div className="port-label" onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
          {title}
        </div>
      </div>
    );
  },
);
