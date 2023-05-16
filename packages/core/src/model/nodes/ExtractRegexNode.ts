import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { nanoid } from 'nanoid';
import { NodeImpl } from '../NodeImpl';
import { DataValue } from '../DataValue';
import { expectType, expectTypeOptional } from '../../utils/expectType';

export type ExtractRegexNode = ChartNode<'extractRegex', ExtractRegexNodeData>;

export type ExtractRegexNodeData = {
  regex: string;
  useRegexInput: boolean;
  errorOnFailed: boolean;
};

export class ExtractRegexNodeImpl extends NodeImpl<ExtractRegexNode> {
  static create(regex: string = '([a-zA-Z]+)'): ExtractRegexNode {
    const chartNode: ExtractRegexNode = {
      type: 'extractRegex',
      title: 'Extract Regex',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 250,
      },
      data: {
        regex,
        useRegexInput: false,
        errorOnFailed: false,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [
      {
        id: 'input' as PortId,
        title: 'Input',
        dataType: 'string',
        required: true,
      },
    ];

    if (this.chartNode.data.useRegexInput) {
      inputs.push({
        id: 'regex' as PortId,
        title: 'Regex',
        dataType: 'string',
        required: false,
      });
    }

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    const regex = this.chartNode.data.regex;
    try {
      const regExp = new RegExp(regex, 'g');
      const captureGroupCount = countCaptureGroups(regExp);

      const outputs: NodeOutputDefinition[] = [];

      for (let i = 0; i < captureGroupCount; i++) {
        outputs.push({
          id: `output${i + 1}` as PortId,
          title: `Output ${i + 1}`,
          dataType: 'string',
        });
      }

      outputs.push({
        id: 'matches' as PortId,
        title: 'Matches',
        dataType: 'string[]',
      });

      outputs.push(
        {
          id: 'succeeded' as PortId,
          title: 'Succeeded',
          dataType: 'boolean',
        },
        {
          id: 'failed' as PortId,
          title: 'Failed',
          dataType: 'boolean',
        },
      );

      return outputs;
    } catch (err) {
      return [];
    }
  }

  async process(inputs: Record<PortId, DataValue>): Promise<Record<PortId, DataValue>> {
    const inputString = expectType(inputs['input' as PortId], 'string');
    const regex = expectTypeOptional(inputs['regex' as PortId], 'string') ?? this.chartNode.data.regex;

    const regExp = new RegExp(regex, 'g');

    let matches = [];
    let match;
    let firstMatch;

    while ((match = regExp.exec(inputString)) !== null) {
      if (!firstMatch) {
        firstMatch = match;
      }
      matches.push(match[1]!);
    }

    matches = matches.filter((m) => m);

    if (matches.length === 0 && this.chartNode.data.errorOnFailed) {
      throw new Error(`No match found for regex ${regex}`);
    }

    const outputArray: DataValue = {
      type: 'string[]',
      value: matches,
    };

    if (!firstMatch) {
      if (this.chartNode.data.errorOnFailed) {
        throw new Error(`No match found for regex ${regex}`);
      }
      return {
        ['succeeded' as PortId]: {
          type: 'boolean',
          value: false,
        },
        ['failed' as PortId]: {
          type: 'boolean',
          value: true,
        },
      };
    }

    const output: Record<PortId, DataValue> = {
      ['succeeded' as PortId]: {
        type: 'boolean',
        value: true,
      },
      ['failed' as PortId]: {
        type: 'boolean',
        value: false,
      },
    };

    output['matches' as PortId] = outputArray;

    for (let i = 1; i < firstMatch.length; i++) {
      output[`output${i}` as PortId] = {
        type: 'string',
        value: firstMatch[i]!,
      };
    }

    return output;
  }
}

function countCaptureGroups(regex: RegExp): number {
  const regexSource = regex.source;
  let count = 0;
  let inCharacterClass = false;

  for (let i = 0; i < regexSource.length; i++) {
    const currentChar = regexSource[i];
    const prevChar = i > 0 ? regexSource[i - 1] : null;

    if (currentChar === '[' && prevChar !== '\\') {
      inCharacterClass = true;
    } else if (currentChar === ']' && prevChar !== '\\') {
      inCharacterClass = false;
    } else if (currentChar === '(' && prevChar !== '\\' && !inCharacterClass) {
      if (regexSource[i + 1] !== '?' || regexSource[i + 2] === ':') {
        count++;
      }
    }
  }

  return count;
}
