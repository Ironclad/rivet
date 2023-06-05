import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { nanoid } from 'nanoid';
import { EditorDefinition, NodeImpl, nodeDefinition } from '../NodeImpl';
import { DataValue } from '../DataValue';
import { match } from 'ts-pattern';
import { coerceTypeOptional } from '../..';

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
        language: 'prompt-interpolation',
        theme: 'prompt-interpolation',
      },
    ];
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
}

export const textNode = nodeDefinition(TextNodeImpl, 'Text');
