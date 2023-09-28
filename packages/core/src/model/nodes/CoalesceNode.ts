import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import {
  type ChartNode,
  type NodeConnection,
  type NodeId,
  type NodeInputDefinition,
  type NodeOutputDefinition,
  type PortId,
} from '../NodeBase.js';
import { type DataValue, unwrapDataValue } from '../DataValue.js';
import { nanoid } from 'nanoid/non-secure';
import { type Inputs, type Outputs } from '../GraphProcessor.js';
import { dedent } from 'ts-dedent';
import { nodeDefinition } from '../NodeDefinition.js';

export type CoalesceNode = ChartNode<'coalesce', CoalesceNodeData>;

export type CoalesceNodeData = {};

export class CoalesceNodeImpl extends NodeImpl<CoalesceNode> {
  static create = (): CoalesceNode => {
    const chartNode: CoalesceNode = {
      type: 'coalesce',
      title: 'Coalesce',
      id: nanoid() as NodeId,
      data: {},
      visualData: {
        x: 0,
        y: 0,
        width: 150,
      },
    };
    return chartNode;
  };

  getInputDefinitions(connections: NodeConnection[]): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [];
    const inputCount = this.#getInputPortCount(connections);

    inputs.push({
      dataType: 'boolean',
      id: 'conditional' as PortId,
      title: 'Conditional',
    });

    for (let i = 1; i <= inputCount; i++) {
      inputs.push({
        dataType: 'any',
        id: `input${i}` as PortId,
        title: `Input ${i}`,
      });
    }

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        dataType: 'any',
        id: 'output' as PortId,
        title: 'Output',
      },
    ];
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Takes in any number of inputs and outputs the first value that exists. Useful for consolidating branches after a Match node. This node can also "consume" the "Not Ran" value.
      `,
      infoBoxTitle: 'Coalesce Node',
      contextMenuTitle: 'Coalesce',
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

  async process(inputData: Inputs): Promise<Outputs> {
    const conditional = inputData['conditional' as PortId];

    // This lets the coalesce actually be control-flow-excluded itself, because otherwise
    // the input control-flow-excluded are consumed.
    if (conditional?.type === 'control-flow-excluded') {
      return {
        ['output' as PortId]: {
          type: 'control-flow-excluded',
          value: undefined,
        },
      };
    }

    const inputCount = Object.keys(inputData).filter((key) => key.startsWith('input')).length;
    const okInputValues: DataValue[] = [];

    for (let i = 1; i <= inputCount; i++) {
      const inputValue = inputData[`input${i}` as PortId];
      if (inputValue && inputValue.type !== 'control-flow-excluded' && unwrapDataValue(inputValue) != null) {
        okInputValues.push(inputValue);
      }
    }

    if (okInputValues.length === 0) {
      return {
        ['output' as PortId]: {
          type: 'control-flow-excluded',
          value: undefined,
        },
      };
    }

    return {
      ['output' as PortId]: okInputValues[0]!,
    };
  }
}

export const coalesceNode = nodeDefinition(CoalesceNodeImpl, 'Coalesce');
