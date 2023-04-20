import { useState, useCallback, useEffect } from 'react';
import { WireDef } from '../components/WireLayer';
import { ChartNode, NodeConnection, NodeId, PortId } from '../model/NodeBase';
import { createUnknownNodeInstance } from '../model/Nodes';

export const useDraggingWire = (
  nodes: ChartNode<string, unknown>[],
  connections: NodeConnection[],
  onConnectionsChanged: (connections: NodeConnection[]) => void,
) => {
  const [draggingWire, setDraggingWire] = useState<WireDef | undefined>();

  const onWireStartDrag = useCallback(
    (event: React.MouseEvent<HTMLElement>, startNodeId: NodeId, startPortId: PortId) => {
      event.stopPropagation();

      // Check if the starting port is an input port
      const startNode = nodes.find((n) => n.id === startNodeId);
      if (startNode) {
        const startNodeImpl = createUnknownNodeInstance(startNode);
        const isInputPort = startNodeImpl.getInputDefinitions().some((i) => i.id === startPortId);

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
              startNodeId: connections[existingConnectionIndex].outputNodeId,
              startPortId: connections[existingConnectionIndex].outputId,
            });
          }
        }
      } else {
        setDraggingWire({ startNodeId, startPortId });
      }
    },
    [connections, nodes, onConnectionsChanged],
  );

  const onWireEndDrag = useCallback(
    (event: React.MouseEvent<HTMLElement>, endNodeId: NodeId, endPortId: PortId) => {
      event.stopPropagation();
      if (draggingWire) {
        let inputNode = nodes.find((n) => n.id === endNodeId);
        let outputNode = nodes.find((n) => n.id === draggingWire.startNodeId);

        let input = inputNode
          ? createUnknownNodeInstance(inputNode)
              .getInputDefinitions()
              .find((i) => i.id === endPortId)
          : null;

        let output = outputNode
          ? createUnknownNodeInstance(outputNode)
              .getOutputDefinitions()
              .find((o) => o.id === draggingWire.startPortId)
          : null;

        if (!inputNode || !outputNode || !input || !output) {
          const tmp = inputNode;
          inputNode = outputNode;
          outputNode = tmp;

          input = inputNode
            ? createUnknownNodeInstance(inputNode)
                .getInputDefinitions()
                .find((i) => i.id === endPortId)
            : null;
          output = outputNode
            ? createUnknownNodeInstance(outputNode)
                .getOutputDefinitions()
                .find((o) => o.id === draggingWire.startPortId)
            : null;

          if (!inputNode || !outputNode || !input || !output) {
            setDraggingWire(undefined);
            return;
          }
        }

        const connection: NodeConnection = {
          inputNodeId: inputNode.id,
          inputId: input.id,
          outputNodeId: outputNode.id,
          outputId: output.id,
        };

        onConnectionsChanged?.([...connections, connection]);
        setDraggingWire(undefined);
      }
    },
    [draggingWire, connections, nodes, onConnectionsChanged],
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
