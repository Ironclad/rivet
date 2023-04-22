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
  static create(regex: string = '/([a-zA-Z]+)/'): ExtractRegexNode {
    const chartNode: ExtractRegexNode = {
      type: 'extractRegex',
      title: 'Extract Regex',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
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
    return [
      {
        id: 'output' as PortId,
        title: 'Output',
        dataType: 'string',
      },
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
    ];
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
        output: {
          type: 'string',
          value: '',
        },
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

    return {
      output: {
        type: 'string',
        value: match[0],
      },
      succeeded: {
        type: 'boolean',
        value: true,
      },
      failed: {
        type: 'boolean',
        value: false,
      },
    };
  }
}
