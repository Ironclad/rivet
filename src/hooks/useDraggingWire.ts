import { useState, useCallback, useEffect } from 'react';
import { WireDef } from '../components/WireLayer';
import { ChartNode, NodeConnection, NodeId, PortId } from '../model/NodeBase';

export const useDraggingWire = (
  nodes: ChartNode<string, unknown>[],
  connections: NodeConnection[],
  onConnectionsChanged: (connections: NodeConnection[]) => void,
) => {
  const [draggingWire, setDraggingWire] = useState<WireDef | undefined>();

  const onWireStartDrag = useCallback(
    (event: React.MouseEvent<HTMLElement>, startNodeId: NodeId, startPortId: PortId) => {
      event.stopPropagation();
      setDraggingWire({ startNodeId, startPortId });
    },
    [],
  );

  const onWireEndDrag = useCallback(
    (event: React.MouseEvent<HTMLElement>, endNodeId: NodeId, endPortId: PortId) => {
      event.stopPropagation();
      if (draggingWire) {
        let inputNode = nodes.find((n) => n.id === endNodeId);
        let outputNode = nodes.find((n) => n.id === draggingWire.startNodeId);
        let input = inputNode?.inputDefinitions.find((i) => i.id === endPortId);
        let output = outputNode?.outputDefinitions.find((o) => o.id === draggingWire.startPortId);

        if (!inputNode || !outputNode || !input || !output) {
          const tmp = inputNode;
          inputNode = outputNode;
          outputNode = tmp;
          input = inputNode?.inputDefinitions.find((i) => i.id === endPortId);
          output = outputNode?.outputDefinitions.find((o) => o.id === draggingWire.startPortId);

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
