import { useState, useCallback, useEffect } from 'react';
import { WireDef } from '../components/WireLayer';
import { ChartNode, NodeConnection, NodeId, PortId } from '@ironclad/nodai-core';
import { useGetNodeIO } from './useGetNodeIO';

export const useDraggingWire = (
  nodes: ChartNode[],
  connections: NodeConnection[],
  onConnectionsChanged: (connections: NodeConnection[]) => void,
) => {
  const [draggingWire, setDraggingWire] = useState<WireDef | undefined>();
  const getIO = useGetNodeIO();

  const onWireStartDrag = useCallback(
    (event: React.MouseEvent<HTMLElement>, startNodeId: NodeId, startPortId: PortId) => {
      event.stopPropagation();

      // Check if the starting port is an input port
      const startNode = nodes.find((n) => n.id === startNodeId);
      if (startNode) {
        const { inputDefinitions } = getIO(startNode);
        const isInputPort = inputDefinitions.some((i) => i.id === startPortId);

        if (isInputPort) {
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
            });
            return;
          }
        }
      }
      setDraggingWire({ startNodeId, startPortId });
    },
    [connections, nodes, onConnectionsChanged, getIO],
  );

  const onWireEndDrag = useCallback(
    (event: React.MouseEvent<HTMLElement>, endNodeId: NodeId, endPortId: PortId) => {
      event.stopPropagation();
      if (draggingWire) {
        let inputNode = nodes.find((n) => n.id === endNodeId);
        let outputNode = nodes.find((n) => n.id === draggingWire.startNodeId);

        let inputNodeIO = inputNode ? getIO(inputNode) : null;
        let outputNodeIO = outputNode ? getIO(outputNode) : null;

        let input = inputNode ? inputNodeIO?.inputDefinitions.find((i) => i.id === endPortId) : null;
        let output = outputNode ? outputNodeIO?.outputDefinitions.find((o) => o.id === draggingWire.startPortId) : null;

        if (!inputNode || !outputNode || !input || !output) {
          const tmp = inputNode;
          inputNode = outputNode;
          outputNode = tmp;

          inputNodeIO = inputNode ? getIO(inputNode) : null;
          outputNodeIO = outputNode ? getIO(outputNode) : null;

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

        let newConnections = [...connections];

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
      }
    },
    [draggingWire, connections, nodes, onConnectionsChanged, getIO],
  );

  useEffect(() => {
    const handleWindowClick = (event: MouseEvent) => {
      // If mouse is released without connecting to another port, remove the dragging wire
      if (draggingWire && event.type === 'mouseup') {
        const isMouseOverPort = (event.target as HTMLElement)?.classList.contains('port-circle');

        if (!isMouseOverPort) {
          setDraggingWire(undefined);
        }
      }
    };

    window.addEventListener('mouseup', handleWindowClick);
    return () => {
      window.removeEventListener('mouseup', handleWindowClick);
    };
  }, [draggingWire]);

  return {
    draggingWire,
    onWireStartDrag,
    onWireEndDrag,
  };
};
