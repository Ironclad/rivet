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
import { expectType } from '../../utils/index.js';
import { dedent } from 'ts-dedent';

export type ExtractJsonNode = ChartNode<'extractJson', ExtractJsonNodeData>;

export type ExtractJsonNodeData = {};

export class ExtractJsonNodeImpl extends NodeImpl<ExtractJsonNode> {
  static create(): ExtractJsonNode {
    const chartNode: ExtractJsonNode = {
      type: 'extractJson',
      title: 'Extract JSON',
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

  getInputDefinitions(): NodeInputDefinition[] {
    return [
      {
        id: 'input' as PortId,
        title: 'Input',
        dataType: 'string',
        required: true,
        coerced: false,
      },
    ];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'output' as PortId,
        title: 'Output',
        dataType: 'object',
      },
      {
        id: 'noMatch' as PortId,
        title: 'No Match',
        dataType: 'string',
      },
    ];
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Finds and parses the first JSON object in the input text.

        Outputs the parsed object.
      `,
      infoBoxTitle: 'Extract JSON Node',
      contextMenuTitle: 'Extract JSON',
      group: ['Objects'],
    };
  }

  async process(inputs: Record<PortId, DataValue>): Promise<Record<PortId, DataValue>> {
    const inputString = expectType(inputs['input' as PortId], 'string');

    try {
      const parsed = JSON.parse(inputString);
      return {
        ['output' as PortId]: {
          type: 'object',
          value: parsed,
        },
        ['noMatch' as PortId]: {
          type: 'control-flow-excluded',
          value: undefined,
        },
      };
    } catch (_err: unknown) {
      // Fall back to more manual parsing
    }

    // Find the first { or [ and the last } or ], and try parsing everything in between including them.

    let firstBracket = inputString.indexOf('{');
    let lastBracket = inputString.lastIndexOf('}');
    let firstSquareBracket = inputString.indexOf('[');
    let lastSquareBracket = inputString.lastIndexOf(']');

    const firstIndex =
      firstBracket >= 0 && firstSquareBracket >= 0
        ? Math.min(firstBracket, firstSquareBracket)
        : firstBracket >= 0
          ? firstBracket
          : firstSquareBracket;

    const lastIndex =
      lastBracket >= 0 && lastSquareBracket >= 0
        ? Math.max(lastBracket, lastSquareBracket)
        : lastBracket >= 0
          ? lastBracket
          : lastSquareBracket;

    const substring = inputString.substring(firstIndex, lastIndex + 1);

    let jsonObject: Record<string, unknown> | undefined = undefined;
    try {
      jsonObject = JSON.parse(substring);
    } catch (err) {
      return {
        ['noMatch' as PortId]: {
          type: 'string',
          value: inputString,
        },
        ['output' as PortId]: {
          type: 'control-flow-excluded',
          value: undefined,
        },
      };
    }

    return {
      ['output' as PortId]: {
        type: 'object',
        value: jsonObject!,
      },
      ['noMatch' as PortId]: {
        type: 'control-flow-excluded',
        value: undefined,
      },
    };
  }
}

export const extractJsonNode = nodeDefinition(ExtractJsonNodeImpl, 'Extract JSON');
