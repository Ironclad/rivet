import { useCallback, useEffect } from 'react';
import { type NodeConnection, type NodeId, type PortId } from '@ironclad/rivet-core';
import { useAtom, useAtomValue } from 'jotai';
import { connectionsState, ioDefinitionsState, nodesByIdState } from '../state/graph.js';
import { draggingWireClosestPortState, draggingWireState } from '../state/graphBuilder.js';
import { useLatest } from 'ahooks';
import { useMakeConnectionCommand } from '../commands/makeConnectionCommand';
import { useBreakConnectionCommand } from '../commands/breakConnectionCommand';

export const useDraggingWire = (onConnectionsChanged: (connections: NodeConnection[]) => void) => {
  const [draggingWire, setDraggingWire] = useAtom(draggingWireState);
  const ioByNode = useAtomValue(ioDefinitionsState);
  const connections = useAtomValue(connectionsState);
  const nodesById = useAtomValue(nodesByIdState);
  const [closestPortToDraggingWire, setClosestPortToDraggingWire] = useAtom(draggingWireClosestPortState);
  const isDragging = !!draggingWire;

  const latestClosestPort = useLatest(closestPortToDraggingWire);

  const makeConnection = useMakeConnectionCommand();
  const breakConnection = useBreakConnectionCommand();

  useEffect(() => {
    if (closestPortToDraggingWire && isDragging) {
      setDraggingWire((w) => ({
        ...w!,
        endNodeId: closestPortToDraggingWire.nodeId,
        endPortId: closestPortToDraggingWire.portId,
      }));
    } else if (isDragging) {
      setDraggingWire((w) => ({ ...w!, endNodeId: undefined, endPortId: undefined }));
    }
  }, [closestPortToDraggingWire, setDraggingWire, isDragging]);

  const onWireStartDrag = useCallback(
    (event: React.MouseEvent<HTMLElement>, startNodeId: NodeId, startPortId: PortId, isInput: boolean) => {
      event.stopPropagation();

      if (isInput) {
        // If the input port is already connected, remove the existing connection
        const existingConnectionIndex = connections.findIndex(
          (conn) => conn.inputNodeId === startNodeId && conn.inputId === startPortId,
        );

        if (existingConnectionIndex !== -1) {
          breakConnection({ connectionToBreak: connections[existingConnectionIndex]! });

          const { outputId, outputNodeId } = connections[existingConnectionIndex]!;

          const def = ioByNode[outputNodeId]!.outputDefinitions.find((o) => o.id === outputId)!;

          setDraggingWire({
            startNodeId: outputNodeId,
            startPortId: outputId,
            startPortIsInput: false,
            dataType: def.dataType,
          });
          return;
        }
        return;
      }

      const def = ioByNode[startNodeId]!.outputDefinitions.find((o) => o.id === startPortId)!;
      setDraggingWire({ startNodeId, startPortId, startPortIsInput: isInput, dataType: def.dataType });
    },
    [connections, ioByNode, setDraggingWire, breakConnection],
  );

  const onWireEndDrag = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!draggingWire) {
        return;
      }

      const { nodeId: endNodeId, portId: endPortId } = closestPortToDraggingWire ?? {};

      if (!endNodeId || !endPortId) {
        return;
      }

      event.stopPropagation();

      let inputNode = nodesById[endNodeId];
      let outputNode = nodesById[draggingWire.startNodeId];

      let inputNodeIO = inputNode ? ioByNode[inputNode.id]! : null;
      let outputNodeIO = outputNode ? ioByNode[outputNode.id]! : null;

      let input = inputNode ? inputNodeIO?.inputDefinitions.find((i) => i.id === endPortId) : null;
      let output = outputNode ? outputNodeIO?.outputDefinitions.find((o) => o.id === draggingWire.startPortId) : null;

      if (!inputNode || !outputNode || !input || !output) {
        const tmp = inputNode;
        inputNode = outputNode;
        outputNode = tmp;

        inputNodeIO = inputNode ? ioByNode[inputNode.id]! : null;
        outputNodeIO = outputNode ? ioByNode[outputNode.id]! : null;

        input = inputNode ? inputNodeIO?.inputDefinitions.find((i) => i.id === endPortId) : null;
        output = outputNode ? outputNodeIO?.outputDefinitions.find((o) => o.id === draggingWire.startPortId) : null;

        if (!inputNode || !outputNode || !input || !output) {
          setDraggingWire(undefined);
          setClosestPortToDraggingWire(undefined);
          return;
        }
      }

      makeConnection({
        outputNodeId: outputNode.id,
        outputId: draggingWire.startPortId,
        inputNodeId: inputNode.id,
        inputId: endPortId,
      });

      const isControlPressed = event.ctrlKey || event.metaKey;

      if (!isControlPressed) {
        setDraggingWire(undefined);
        setClosestPortToDraggingWire(undefined);
      }
    },
    [
      draggingWire,
      nodesById,
      ioByNode,
      setDraggingWire,
      closestPortToDraggingWire,
      setClosestPortToDraggingWire,
      makeConnection,
    ],
  );

  useEffect(() => {
    const handleWindowClick = (event: MouseEvent) => {
      const isControlPressed = event.ctrlKey || event.metaKey;

      // If mouse is released without connecting to another port, remove the dragging wire
      if (draggingWire && event.type === 'mouseup' && !isControlPressed) {
        if (!latestClosestPort.current) {
          setDraggingWire(undefined);
        }
      }
    };

    window.addEventListener('mouseup', handleWindowClick);
    return () => {
      window.removeEventListener('mouseup', handleWindowClick);
    };
  }, [draggingWire, setDraggingWire, latestClosestPort]);

  return {
    draggingWire,
    onWireStartDrag,
    onWireEndDrag,
  };
};
