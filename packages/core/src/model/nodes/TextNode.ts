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
import { type EditorDefinition, type NodeBodySpec } from '../../index.js';
import { dedent } from 'ts-dedent';
import { coerceTypeOptional } from '../../utils/coerceType.js';
import { interpolate } from '../../utils/interpolation.js';

export type TextNode = ChartNode<'text', TextNodeData>;

export type TextNodeData = {
  text: string;
};

export class TextNodeImpl extends NodeImpl<TextNode> {
  static create(): TextNode {
    const chartNode: TextNode = {
      type: 'text',
      title: 'Text',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 300,
      },
      data: {
        text: '{{input}}',
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    // Extract inputs from text, everything like {{input}}
    const inputNames = [...new Set(this.chartNode.data.text.match(/\{\{([^}]+)\}\}/g))];
    return (
      inputNames?.map((inputName) => {
        return {
          type: 'string',
          // id and title should not have the {{ and }}
          id: inputName.slice(2, -2) as PortId,
          title: inputName.slice(2, -2),
          dataType: 'string',
          required: false,
        };
      }) ?? []
    );
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'output' as PortId,
        title: 'Output',
        dataType: 'string',
      },
    ];
  }

  getEditors(): EditorDefinition<TextNode>[] {
    return [
      {
        type: 'code',
        label: 'Text',
        dataKey: 'text',
        language: 'prompt-interpolation-markdown',
        theme: 'prompt-interpolation',
      },
    ];
  }

  getBody(): string | NodeBodySpec | undefined {
    const truncated = this.data.text.split('\n').slice(0, 15).join('\n').trim();

    return {
      type: 'colorized',
      language: 'prompt-interpolation-markdown',
      theme: 'prompt-interpolation',
      text: truncated,
    };
  }

  async process(inputs: Record<string, DataValue>): Promise<Record<string, DataValue>> {
    const inputMap = Object.keys(inputs).reduce((acc, key) => {
      const stringValue = coerceTypeOptional(inputs[key], 'string') ?? '';

      acc[key] = stringValue;
      return acc;
    }, {} as Record<string, string>);

    const outputValue = interpolate(this.chartNode.data.text, inputMap);

    return {
      output: {
        type: 'string',
        value: outputValue,
      },
    };
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Outputs a string of text. It can also interpolate values using <span style="color: var(--primary)">{{tags}}</span>.

        The inputs are dynamic based on the interpolation tags.
      `,
      contextMenuTitle: 'Text',
      infoBoxTitle: 'Text Node',
      group: ['Common', 'Text'],
    };
  }
}

export const textNode = nodeDefinition(TextNodeImpl, 'Text');
