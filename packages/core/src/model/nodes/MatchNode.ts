import {
  type ChartNode,
  type NodeId,
  type NodeInputDefinition,
  type PortId,
  type NodeOutputDefinition,
} from '../NodeBase.js';
import { nanoid } from 'nanoid/non-secure';
import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import { nodeDefinition } from '../NodeDefinition.js';
import { type DataValue } from '../DataValue.js';
import { type EditorDefinition, type Inputs, type NodeBody, type Outputs } from '../../index.js';
import { dedent } from 'ts-dedent';
import { coerceType } from '../../utils/coerceType.js';
import type { RivetUIContext } from '../RivetUIContext.js';

export type MatchNode = ChartNode<'match', MatchNodeData>;

export type MatchNodeData = {
  cases: string[];

  /** If true, only the first matching branch will be ran. */
  exclusive?: boolean;
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
        description: 'The value that will be tested against each of the cases.',
      },
      {
        id: 'value' as PortId,
        title: 'Value',
        dataType: 'any',
        description:
          'The value passed through to the output port that matches. If unconnected, the test value will be passed through.',
      },
    ];

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    const outputs: NodeOutputDefinition[] = [];

    for (let i = 0; i < this.data.cases.length; i++) {
      outputs.push({
        id: `case${i + 1}` as PortId,
        title: this.data.cases[i]?.trim() ? this.data.cases[i]! : `Case ${i + 1}`,
        dataType: 'string',
        description: `The 'value' (or 'test' if value is unconnected) passed through if the test value matches this regex: /${this
          .data.cases[i]!}/`,
      });
    }

    outputs.push({
      id: 'unmatched' as PortId,
      title: 'Unmatched',
      dataType: 'string',
      description: 'The value (or test if value is unconnected) passed through if no regexes match.',
    });

    return outputs;
  }

  getBody(): NodeBody {
    return dedent`
      ${this.data.exclusive ? 'First Matching Case' : 'All Matching Cases'}
      ${this.data.cases.length} Cases
    `;
  }

  getEditors(): EditorDefinition<MatchNode>[] {
    return [
      {
        type: 'toggle',
        dataKey: 'exclusive',
        label: 'Exclusive',
        helperMessage: 'If enabled, only the first matching branch will be ran.',
      },
      {
        type: 'stringList',
        dataKey: 'cases',
        label: 'Cases',
        placeholder: 'Case (regular expression)',
        helperMessage: '(Regular expressions)',
      },
    ];
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

    const cases = this.data.cases;
    let matched = false;
    const output: Outputs = {};

    for (let i = 0; i < cases.length; i++) {
      const regExp = new RegExp(cases[i]!);
      const match = regExp.test(inputString);

      const canMatch = !this.data.exclusive || !matched;
      if (match && canMatch) {
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
