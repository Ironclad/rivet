import {
  type ChartNode,
  type NodeConnection,
  type NodeId,
  type NodeInputDefinition,
  type NodeOutputDefinition,
  type PortId,
} from '../NodeBase.js';
import { nanoid } from 'nanoid/non-secure';
import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import { nodeDefinition } from '../NodeDefinition.js';
import { type Inputs, type Outputs } from '../GraphProcessor.js';
import { type EditorDefinition } from '../../index.js';
import { dedent } from 'ts-dedent';
import { getInputOrData } from '../../utils/inputs.js';

export type DelayNode = ChartNode<'delay', DelayNodeData>;

export type DelayNodeData = {
  delay: number;
  useDelayInput?: boolean;
};

export class DelayNodeImpl extends NodeImpl<DelayNode> {
  static create(): DelayNode {
    const chartNode: DelayNode = {
      type: 'delay',
      title: 'Delay',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 175,
      },
      data: {
        delay: 0,
      },
    };

    return chartNode;
  }

  getInputDefinitions(connections: NodeConnection[]): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [];
    const inputCount = this.#getInputPortCount(connections);

    if (this.data.useDelayInput) {
      inputs.push({
        dataType: 'number',
        id: 'delay' as PortId,
        title: 'Delay (ms)',
      });
    }

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

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Delays the execution and then passes the input value to the output without any modifications.
      `,
      infoBoxTitle: 'Delay Node',
      contextMenuTitle: 'Delay',
      group: ['Logic'],
    };
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

  getEditors(): EditorDefinition<DelayNode>[] {
    return [
      {
        type: 'number',
        label: 'Delay (ms)',
        dataKey: 'delay',
        useInputToggleDataKey: 'useDelayInput',
        defaultValue: 0,
      },
    ];
  }

  getBody(): string | undefined {
    return `Delay ${this.data.useDelayInput ? '(Input ms)' : `${this.chartNode.data.delay}ms`}`;
  }

  async process(inputData: Inputs): Promise<Outputs> {
    const delayAmount = getInputOrData(this.data, inputData, 'delay', 'number');

    await new Promise((resolve) => setTimeout(resolve, delayAmount));

    const inputCount = Object.keys(inputData).filter((key) => key.startsWith('input')).length;

    const outputs: Outputs = {};

    for (let i = 1; i <= inputCount; i++) {
      const input = inputData[`input${i}` as PortId]!;
      outputs[`output${i}` as PortId] = input;
    }

    return outputs;
  }
}

export const delayNode = nodeDefinition(DelayNodeImpl, 'Delay');
