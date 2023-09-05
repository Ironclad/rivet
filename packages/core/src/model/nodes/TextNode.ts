import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase.js';
import { nanoid } from 'nanoid';
import { NodeImpl, NodeUIData, nodeDefinition } from '../NodeImpl.js';
import { DataValue } from '../DataValue.js';
import { match } from 'ts-pattern';
import { EditorDefinition, NodeBodySpec, coerceTypeOptional } from '../../index.js';
import { dedent } from 'ts-dedent';

export type TextNode = ChartNode<'text', TextNodeData>;

export type TextNodeData = {
  text: string;
};

export class TextNodeImpl extends NodeImpl<TextNode> {
  static create(text: string = '{{input}}'): TextNode {
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
        text,
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

  interpolate(baseString: string, values: Record<string, any>): string {
    return baseString.replace(/\{\{([^}]+)\}\}/g, (_m, p1) => {
      const value = values[p1];
      return value !== undefined ? value.toString() : '';
    });
  }

  async process(inputs: Record<string, DataValue>): Promise<Record<string, DataValue>> {
    const inputMap = Object.keys(inputs).reduce((acc, key) => {
      const stringValue = coerceTypeOptional(inputs[key], 'string') ?? '';

      acc[key] = stringValue;
      return acc;
    }, {} as Record<string, string>);

    const outputValue = this.interpolate(this.chartNode.data.text, inputMap);

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
