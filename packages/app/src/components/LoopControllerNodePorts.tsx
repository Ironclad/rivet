import {
  type NodeInputDefinition,
  type ChartNode,
  type NodeConnection,
  type NodeId,
  type PortId,
  type NodeOutputDefinition,
} from '@ironclad/rivet-core';
import { type FC, type MouseEvent } from 'react';
import { useNodeIO } from '../hooks/useGetNodeIO.js';
import { useStableCallback } from '../hooks/useStableCallback.js';
import { Port } from './Port.js';
import { useDependsOnPlugins } from '../hooks/useDependsOnPlugins';
import { type DraggingWireDef } from '../state/graphBuilder';

export type NodePortsProps = {
  node: ChartNode;
  connections: NodeConnection[];
  zoomedOut?: boolean;
  draggingWire: DraggingWireDef | undefined;
  closestPortToDraggingWire: { nodeId: NodeId; portId: PortId } | undefined;
  onWireStartDrag?: (
    event: MouseEvent<HTMLElement>,
    startNodeId: NodeId,
    startPortId: PortId,
    isInput: boolean,
  ) => void;
  onWireEndDrag?: (event: MouseEvent<HTMLElement>, endNodeId: NodeId, endPortId: PortId) => void;
  onPortMouseOver?: (
    event: MouseEvent<HTMLElement>,
    nodeId: NodeId,
    isInput: boolean,
    portId: PortId,
    definition: NodeInputDefinition | NodeOutputDefinition,
  ) => void;
  onPortMouseOut?: (
    event: MouseEvent<HTMLElement>,
    nodeId: NodeId,
    isInput: boolean,
    portId: PortId,
    definition: NodeInputDefinition | NodeOutputDefinition,
  ) => void;
};

export const LoopControllerNodePorts: FC<NodePortsProps> = ({
  node,
  connections,
  draggingWire,
  closestPortToDraggingWire,
  onWireStartDrag,
  onWireEndDrag,
  onPortMouseOver,
  onPortMouseOut,
}) => {
  const { inputDefinitions, outputDefinitions } = useNodeIO(node.id)!;

  const handlePortMouseDown = useStableCallback((event: MouseEvent<HTMLDivElement>, port: PortId, isInput: boolean) => {
    event.stopPropagation();
    event.preventDefault();
    onWireStartDrag?.(event, node.id, port, isInput);
  });

  const handlePortMouseUp = useStableCallback((event: MouseEvent<HTMLDivElement>, port: PortId) => {
    onWireEndDrag?.(event, node.id, port);
  });

  useDependsOnPlugins();

  const groupedInputsAndOutputs: {
    inputDefinitions: NodeInputDefinition[];
    outputDefinition: NodeInputDefinition | undefined;
  }[] = [];

  const inputCount = inputDefinitions.filter((input) => /input(\d+)$/.test(input.id)).length;

  for (let i = 0; i < inputCount; i++) {
    const input = inputDefinitions.find((input) => input.id === `input${i + 1}`);
    const inputDefault = inputDefinitions.find((input) => input.id === `input${i + 1}Default`);
    const output = outputDefinitions.find((output) => output.id === `output${i + 1}`);

    if (input && inputDefault) {
      groupedInputsAndOutputs.push({
        inputDefinitions: [input, inputDefault],
        outputDefinition: output,
      });
    }
  }

  const otherInputPorts = inputDefinitions.filter((input) =>
    groupedInputsAndOutputs.every((group) => !group.inputDefinitions.includes(input)),
  );
  const otherOutputPorts = outputDefinitions.filter((output) =>
    groupedInputsAndOutputs.every((group) => group.outputDefinition !== output),
  );

  return (
    <div className="node-ports-groups">
      <div className="node-ports-group">
        <header>Control</header>
        <div className="node-ports">
          <div className="input-ports">
            {otherInputPorts.map((input) => {
              const connected =
                connections.some((conn) => conn.inputNodeId === node.id && conn.inputId === input.id) ||
                (draggingWire?.endNodeId === node.id && draggingWire?.endPortId === input.id);
              return (
                <Port
                  title={input.title}
                  id={input.id}
                  input
                  connected={connected}
                  key={`input-${input.id}`}
                  nodeId={node.id}
                  canDragTo={draggingWire ? !draggingWire.startPortIsInput : false}
                  closest={
                    closestPortToDraggingWire?.nodeId === node.id && closestPortToDraggingWire.portId === input.id
                  }
                  draggingDataType={draggingWire?.dataType}
                  definition={input}
                  onMouseDown={handlePortMouseDown}
                  onMouseUp={handlePortMouseUp}
                  onMouseOver={onPortMouseOver}
                  onMouseOut={onPortMouseOut}
                />
              );
            })}
          </div>
          <div className="output-ports">
            {otherOutputPorts.map((output) => {
              const connected =
                connections.some((conn) => conn.outputNodeId === node.id && conn.outputId === output.id) ||
                (draggingWire?.startNodeId === node.id && draggingWire?.startPortId === output.id);
              return (
                <Port
                  title={output.title}
                  id={output.id}
                  connected={connected}
                  key={`output-${output.id}`}
                  nodeId={node.id}
                  canDragTo={draggingWire ? draggingWire.startPortIsInput : false}
                  closest={
                    closestPortToDraggingWire?.nodeId === node.id && closestPortToDraggingWire.portId === output.id
                  }
                  definition={output}
                  draggingDataType={draggingWire?.dataType}
                  onMouseDown={handlePortMouseDown}
                  onMouseUp={handlePortMouseUp}
                  onMouseOver={onPortMouseOver}
                  onMouseOut={onPortMouseOut}
                />
              );
            })}
          </div>
        </div>
      </div>

      {groupedInputsAndOutputs.map((group, i) => (
        <div key={i} className="node-ports-group">
          <header>Data {i + 1}</header>
          <div className="node-ports">
            <div className="input-ports">
              {group.inputDefinitions.map((input) => {
                const connected =
                  connections.some((conn) => conn.inputNodeId === node.id && conn.inputId === input.id) ||
                  (draggingWire?.endNodeId === node.id && draggingWire?.endPortId === input.id);
                return (
                  <Port
                    title={input.title}
                    id={input.id}
                    input
                    connected={connected}
                    key={`input-${input.id}`}
                    nodeId={node.id}
                    canDragTo={draggingWire ? !draggingWire.startPortIsInput : false}
                    closest={
                      closestPortToDraggingWire?.nodeId === node.id && closestPortToDraggingWire.portId === input.id
                    }
                    definition={input}
                    draggingDataType={draggingWire?.dataType}
                    onMouseDown={handlePortMouseDown}
                    onMouseUp={handlePortMouseUp}
                    onMouseOver={onPortMouseOver}
                    onMouseOut={onPortMouseOut}
                  />
                );
              })}
            </div>
            <div className="output-ports">
              {[group.outputDefinition].map((output) => {
                if (!output) {
                  return null;
                }

                const connected =
                  connections.some((conn) => conn.outputNodeId === node.id && conn.outputId === output.id) ||
                  (draggingWire?.startNodeId === node.id && draggingWire?.startPortId === output.id);
                return (
                  <Port
                    title={output.title}
                    id={output.id}
                    connected={connected}
                    key={`output-${output.id}`}
                    nodeId={node.id}
                    canDragTo={draggingWire ? draggingWire.startPortIsInput : false}
                    closest={
                      closestPortToDraggingWire?.nodeId === node.id && closestPortToDraggingWire.portId === output.id
                    }
                    definition={output}
                    draggingDataType={draggingWire?.dataType}
                    onMouseDown={handlePortMouseDown}
                    onMouseUp={handlePortMouseUp}
                    onMouseOver={onPortMouseOver}
                    onMouseOut={onPortMouseOut}
                  />
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
