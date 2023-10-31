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
import { expectType, expectTypeOptional } from '../../utils/expectType.js';
import { dedent } from 'ts-dedent';
import { type EditorDefinition } from '../EditorDefinition.js';
import { type NodeBodySpec } from '../NodeBodySpec.js';

export type ExtractRegexNode = ChartNode<'extractRegex', ExtractRegexNodeData>;

export type ExtractRegexNodeData = {
  regex: string;
  useRegexInput: boolean;
  errorOnFailed: boolean;
  multilineMode?: boolean;
};

export class ExtractRegexNodeImpl extends NodeImpl<ExtractRegexNode> {
  static create(): ExtractRegexNode {
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
        regex: '([a-zA-Z]+)',
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
        coerced: false,
      },
    ];

    if (this.chartNode.data.useRegexInput) {
      inputs.push({
        id: 'regex' as PortId,
        title: 'Regex',
        dataType: 'string',
        required: false,
        coerced: false,
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

  getEditors(): EditorDefinition<ExtractRegexNode>[] {
    return [
      {
        type: 'toggle',
        label: 'Error on failed',
        dataKey: 'errorOnFailed',
      },
      {
        type: 'toggle',
        label: 'Multiline mode',
        dataKey: 'multilineMode',
      },
      {
        type: 'code',
        label: 'Regex',
        dataKey: 'regex',
        useInputToggleDataKey: 'useRegexInput',
        language: 'regex',
      },
    ];
  }

  getBody(): string | NodeBodySpec | undefined {
    return this.data.useRegexInput ? '(Using regex input)' : this.data.regex;
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Extracts data from the input text using the configured regular expression. The regular expression can contain capture groups to extract specific parts of the text.

        Each capture group corresponds to an output port of the node.
      `,
      infoBoxTitle: 'Extract With Regex Node',
      contextMenuTitle: 'Extract With Regex',
      group: ['Text'],
    };
  }

  async process(inputs: Record<PortId, DataValue>): Promise<Record<PortId, DataValue>> {
    const inputString = expectType(inputs['input' as PortId], 'string');
    const regex = expectTypeOptional(inputs['regex' as PortId], 'string') ?? this.chartNode.data.regex;

    const regExp = new RegExp(regex, this.data.multilineMode ? 'gm' : 'g');

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

export const extractRegexNode = nodeDefinition(ExtractRegexNodeImpl, 'Extract Regex');
