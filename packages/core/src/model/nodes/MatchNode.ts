import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase.js';
import { nanoid } from 'nanoid';
import { NodeImpl, NodeUIData, nodeDefinition } from '../NodeImpl.js';
import { DataValue } from '../DataValue.js';
import { Inputs, Outputs, coerceType } from '../../index.js';
import { dedent } from 'ts-dedent';

export type MatchNode = ChartNode<'match', MatchNodeData>;

export type MatchNodeData = {
  caseCount: number;
  cases: string[];
};

export class MatchNodeImpl extends NodeImpl<MatchNode> {
  static create(): MatchNode {
    const chartNode: MatchNode = {
      type: 'match',
      title: 'Match',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 250,
      },
      data: {
        caseCount: 2,
        cases: ['YES', 'NO'],
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [
      {
        id: 'input' as PortId,
        title: 'Test',
        dataType: 'string',
        required: true,
      },
      {
        id: 'value' as PortId,
        title: 'Value',
        dataType: 'any',
      },
    ];

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    const outputs: NodeOutputDefinition[] = [];

    for (let i = 0; i < this.chartNode.data.caseCount; i++) {
      outputs.push({
        id: `case${i + 1}` as PortId,
        title: `Case ${i + 1}`,
        dataType: 'string',
      });
    }

    outputs.push({
      id: 'unmatched' as PortId,
      title: 'Unmatched',
      dataType: 'string',
    });

    return outputs;
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Any number of regular expressions can be configured, each corresponding to an output of the node. The output port of the first matching regex will be ran, and all other output ports will not be ran.
      `,
      infoBoxTitle: 'Match Node',
      contextMenuTitle: 'Match',
      group: ['Logic'],
    };
  }

  async process(inputs: Inputs): Promise<Outputs> {
    const inputString = coerceType(inputs['input' as PortId], 'string');
    const value = inputs['value' as PortId];

    const outputType = value === undefined ? 'string' : value.type;
    const outputValue = value === undefined ? inputString : value.value;

    const cases = this.chartNode.data.cases;
    let matched = false;
    const output: Outputs = {};

    for (let i = 0; i < cases.length; i++) {
      const regExp = new RegExp(cases[i]!);
      const match = regExp.test(inputString);

      if (match) {
        matched = true;
        output[`case${i + 1}` as PortId] = {
          type: outputType,
          value: outputValue,
        } as DataValue;
      } else {
        output[`case${i + 1}` as PortId] = {
          type: 'control-flow-excluded',
          value: undefined,
        };
      }
    }

    if (!matched) {
      output['unmatched' as PortId] = {
        type: outputType,
        value: outputValue,
      } as DataValue;
    } else {
      output['unmatched' as PortId] = {
        type: 'control-flow-excluded',
        value: undefined,
      };
    }

    return output;
  }
}

export const matchNode = nodeDefinition(MatchNodeImpl, 'Match');
