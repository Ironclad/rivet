import { useCallback, useEffect } from 'react';
import { NodeConnection, NodeId, PortId } from '@ironclad/rivet-core';
import { useRecoilState, useRecoilValue } from 'recoil';
import { connectionsState, ioDefinitionsState, nodesByIdState } from '../state/graph.js';
import { draggingWireClosestPortState, draggingWireState } from '../state/graphBuilder.js';
import { useLatest } from 'ahooks';

export const useDraggingWire = (onConnectionsChanged: (connections: NodeConnection[]) => void) => {
  const [draggingWire, setDraggingWire] = useRecoilState(draggingWireState);
  const ioByNode = useRecoilValue(ioDefinitionsState);
  const connections = useRecoilValue(connectionsState);
  const nodesById = useRecoilValue(nodesByIdState);
  const closestPortToDraggingWire = useRecoilValue(draggingWireClosestPortState);
  const isDragging = !!draggingWire;

  const latestClosestPort = useLatest(closestPortToDraggingWire);

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
          const newConnections = [...connections];
          newConnections.splice(existingConnectionIndex, 1);
          onConnectionsChanged(newConnections);

          setDraggingWire({
            startNodeId: connections[existingConnectionIndex]!.outputNodeId,
            startPortId: connections[existingConnectionIndex]!.outputId,

            startPortIsInput: false,
          });
          return;
        }
        return;
      }
      setDraggingWire({ startNodeId, startPortId, startPortIsInput: isInput });
    },
    [connections, onConnectionsChanged, setDraggingWire],
  );

  const onWireEndDrag = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!draggingWire) {
        return;
      }

      const { nodeId: endNodeId, portId: endPortId } = closestPortToDraggingWire!;

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
          return;
        }
      }

      // Check if there's an existing connection to the input port
      const existingConnectionIndex = connections.findIndex(
        (c) => inputNode != null && input != null && c.inputNodeId === inputNode.id && c.inputId === input.id,
      );

      const newConnections = [...connections];

      // If there's an existing connection, remove it
      if (existingConnectionIndex !== -1) {
        newConnections.splice(existingConnectionIndex, 1);
      }

      // Add the new connection
      const connection: NodeConnection = {
        inputNodeId: inputNode.id,
        inputId: input.id,
        outputNodeId: outputNode.id,
        outputId: output.id,
      };

      onConnectionsChanged?.([...newConnections, connection]);

      setDraggingWire(undefined);
    },
    [draggingWire, connections, nodesById, onConnectionsChanged, ioByNode, setDraggingWire],
  );

  useEffect(() => {
    const handleWindowClick = (event: MouseEvent) => {
      // If mouse is released without connecting to another port, remove the dragging wire
      if (draggingWire && event.type === 'mouseup') {
        if (!latestClosestPort.current) {
          setDraggingWire(undefined);
        }
      }
    };

    window.addEventListener('mouseup', handleWindowClick);
    return () => {
      window.removeEventListener('mouseup', handleWindowClick);
    };
  }, [draggingWire, setDraggingWire]);

  return {
    draggingWire,
    onWireStartDrag,
    onWireEndDrag,
  };
};
