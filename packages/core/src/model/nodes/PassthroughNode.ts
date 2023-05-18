import { NodeImpl } from '../NodeImpl';
import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase';
import { nanoid } from 'nanoid';
import { Inputs, Outputs } from '../GraphProcessor';

export type PassthroughNode = ChartNode<'passthrough', PassthroughNodeData>;

export type PassthroughNodeData = {};

export class PassthroughNodeImpl extends NodeImpl<ChartNode> {
  static create = (): PassthroughNode => {
    const chartNode: PassthroughNode = {
      type: 'passthrough',
      title: 'Passthrough',
      id: nanoid() as NodeId,
      data: {},
      visualData: {
        x: 0,
        y: 0,
        width: 175,
      },
    };
    return chartNode;
  };

  getInputDefinitions(connections: NodeConnection[]): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [];
    const inputCount = this.#getInputPortCount(connections);

    for (let i = 1; i <= inputCount; i++) {
      inputs.push({
        dataType: 'any',
        id: `input${i}` as PortId,
        title: `Input ${i}`,
      });
    }

    return inputs;
  }

  getOutputDefinitions(connections: NodeConnection[]): NodeOutputDefinition[] {
    const outputs: NodeOutputDefinition[] = [];
    const inputCount = this.#getInputPortCount(connections);

    for (let i = 1; i <= inputCount - 1; i++) {
      outputs.push({
        dataType: 'any',
        id: `output${i}` as PortId,
        title: `Output ${i}`,
      });
    }

    return outputs;
  }

  #getInputPortCount(connections: NodeConnection[]): number {
    const inputNodeId = this.chartNode.id;
    const inputConnections = connections.filter(
      (connection) => connection.inputNodeId === inputNodeId && connection.inputId.startsWith('input'),
    );

    let maxInputNumber = 0;
    for (const connection of inputConnections) {
      const messageNumber = parseInt(connection.inputId.replace('input', ''), 10);
      if (messageNumber > maxInputNumber) {
        maxInputNumber = messageNumber;
      }
    }

    return maxInputNumber + 1;
  }

  async process(inputData: Inputs): Promise<Outputs> {
    const inputCount = Object.keys(inputData).filter((key) => key.startsWith('input')).length;

    const outputs: Outputs = {};

    for (let i = 1; i <= inputCount; i++) {
      const input = inputData[`input${i}` as PortId]!;
      outputs[`output${i}` as PortId] = input;
    }

    return outputs;
  }
}
