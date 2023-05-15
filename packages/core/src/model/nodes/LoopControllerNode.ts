import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase';
import { nanoid } from 'nanoid';
import { InternalProcessContext, NodeImpl } from '../NodeImpl';
import { coerceType } from '../DataValue';
import { Inputs, Outputs } from '../GraphProcessor';

export type LoopControllerNode = ChartNode<'loopController', LoopControllerNodeData>;

export type LoopControllerNodeData = {};

export class LoopControllerNodeImpl extends NodeImpl<LoopControllerNode> {
  static create(): LoopControllerNode {
    const chartNode: LoopControllerNode = {
      type: 'loopController',
      title: 'Loop Controller',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 250,
      },
      data: {},
    };

    return chartNode;
  }

  getInputDefinitions(connections: NodeConnection[], nodes: Record<NodeId, ChartNode>): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [];
    const messageCount = this.#getInputPortCount(connections);

    inputs.push({
      dataType: 'any',
      id: 'continue' as PortId,
      title: 'Continue',
    });

    let i = 1;
    for (; i <= messageCount; i++) {
      const input: NodeInputDefinition = {
        dataType: 'any',
        id: `input${i}` as PortId,
        title: `Input ${i}`,
      };

      const inputConnection = connections.find((connection) => connection.inputId === input.id);
      if (inputConnection && nodes[inputConnection.outputNodeId]) {
        input.title = nodes[inputConnection.outputNodeId]!.title;
      }

      const inputDefault: NodeInputDefinition = {
        dataType: 'any',
        id: `input${i}Default` as PortId,
        title: `Input ${i} Default`,
      };
      const inputDefaultConnection = connections.find((connection) => connection.inputId === inputDefault.id);
      if (inputDefaultConnection && nodes[inputDefaultConnection.outputNodeId]) {
        inputDefault.title = nodes[inputDefaultConnection.outputNodeId]!.title;
      }

      inputs.push(input);
      inputs.push(inputDefault);
    }

    inputs.push({
      dataType: 'any',
      id: `input${i}` as PortId,
      title: `Input ${i}`,
    });

    return inputs;
  }

  getOutputDefinitions(connections: NodeConnection[], nodes: Record<NodeId, ChartNode>): NodeOutputDefinition[] {
    const messageCount = this.#getInputPortCount(connections);

    const outputs: NodeOutputDefinition[] = [];

    outputs.push({
      dataType: 'any',
      id: 'break' as PortId,
      title: 'Break',
    });

    for (let i = 1; i <= messageCount; i++) {
      const output: NodeOutputDefinition = {
        dataType: 'any',
        id: `output${i}` as PortId,
        title: `Output ${i}`,
      };

      const inputConnection = connections.find((connection) => connection.inputId === `input${i}`);
      if (inputConnection && nodes[inputConnection.outputNodeId]) {
        output.title = `${nodes[inputConnection.outputNodeId]!.title}?`;
      }

      outputs.push(output);
    }

    return outputs;
  }

  #getInputPortCount(connections: NodeConnection[]): number {
    const inputNodeId = this.chartNode.id;
    const messageConnections = connections.filter(
      (connection) => connection.inputNodeId === inputNodeId && connection.inputId.startsWith('input'),
    );

    let maxMessageNumber = 0;
    for (const connection of messageConnections) {
      const messageNumber = parseInt(connection.inputId.replace('input', ''));
      if (messageNumber > maxMessageNumber) {
        maxMessageNumber = messageNumber;
      }
    }

    return maxMessageNumber;
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const output: Outputs = {};

    // If the continue port is not connected (so undefined), or if it's undefined before it's
    // inside the loop itself (connection has not ran yet), then we should continue by default.
    const continueValue =
      inputs['continue' as PortId] === undefined ? true : coerceType(inputs['continue' as PortId], 'boolean');

    if (continueValue) {
      output['break' as PortId] = { type: 'control-flow-excluded', value: 'loop-not-broken' };
    } else {
      output['break' as PortId] = { type: 'boolean', value: true };
    }

    const inputCount = Object.keys(inputs).filter((key) => key.startsWith('input') && !key.endsWith('Default')).length;

    for (let i = 1; i <= inputCount; i++) {
      if (continueValue) {
        const inputId = `input${i}` as PortId;
        const outputId = `output${i}` as PortId;

        if (inputs[inputId]) {
          output[outputId] = inputs[inputId]!;
        } else {
          output[outputId] = inputs[`${inputId}Default` as PortId]!;
        }
      } else {
        output[`output${i}` as PortId] = { type: 'control-flow-excluded', value: undefined };
      }
    }

    return output;
  }
}
