import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { nanoid } from 'nanoid';
import { NodeImpl } from '../NodeImpl';
import { DataValue, expectType, expectTypeOptional } from '../DataValue';

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
      const regExp = new RegExp(regex);
      const captureGroupCount = countCaptureGroups(regExp);

      const outputs: NodeOutputDefinition[] = [];

      for (let i = 0; i < captureGroupCount; i++) {
        outputs.push({
          id: `output${i + 1}` as PortId,
          title: `Output ${i + 1}`,
          dataType: 'string',
        });
      }

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

  async process(inputs: Record<string, DataValue>): Promise<Record<string, DataValue>> {
    const inputString = expectType(inputs.input, 'string');
    const regex = expectTypeOptional(inputs['regex'], 'string') ?? this.chartNode.data.regex;

    const regExp = new RegExp(regex);
    const match = regExp.exec(inputString);

    if (!match) {
      if (this.chartNode.data.errorOnFailed) {
        throw new Error(`No match found for regex ${regex}`);
      }
      return {
        succeeded: {
          type: 'boolean',
          value: false,
        },
        failed: {
          type: 'boolean',
          value: true,
        },
      };
    }

    const output: Record<string, DataValue> = {
      succeeded: {
        type: 'boolean',
        value: true,
      },
      failed: {
        type: 'boolean',
        value: false,
      },
    };

    for (let i = 1; i < match.length; i++) {
      output[`output${i}`] = {
        type: 'string',
        value: match[i],
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
