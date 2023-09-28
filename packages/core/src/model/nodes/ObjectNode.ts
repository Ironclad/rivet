import {
  type ChartNode,
  type NodeConnection,
  type NodeId,
  type NodeInputDefinition,
  type NodeOutputDefinition,
  type PortId,
} from '../NodeBase.js';
import { nanoid } from 'nanoid/non-secure';
import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import { nodeDefinition } from '../NodeDefinition.js';
import { type DataValue } from '../DataValue.js';
import { dedent } from 'ts-dedent';
import { type EditorDefinition } from '../EditorDefinition.js';

export type ObjectNode = ChartNode<'object', ObjectNodeData>;

export type ObjectNodeData = {
  jsonTemplate: string;
};

const DEFAULT_JSON_TEMPLATE = `{
  "key": "{{input}}"
}`;

export class ObjectNodeImpl extends NodeImpl<ObjectNode> {
  static create(): ObjectNode {
    const chartNode: ObjectNode = {
      type: 'object',
      title: 'Object',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 200,
      },
      data: {
        jsonTemplate: DEFAULT_JSON_TEMPLATE,
      },
    };

    return chartNode;
  }

  getInputDefinitions(connections: NodeConnection[]): NodeInputDefinition[] {
    // Extract inputs from text, everything like {{input}}
    const inputNames = [...new Set(this.chartNode.data.jsonTemplate.match(/\{\{([^}]+)\}\}/g))];
    return (
      inputNames?.map((inputName) => {
        return {
          // id and title should not have the {{ and }}
          id: inputName.slice(2, -2) as PortId,
          title: inputName.slice(2, -2),
          dataType: 'any',
          required: false,
        };
      }) ?? []
    );
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        dataType: 'object',
        id: 'output' as PortId,
        title: 'Output',
      },
    ];
  }

  getEditors(): EditorDefinition<ObjectNode>[] {
    return [
      {
        type: 'code',
        label: 'JSON Template',
        dataKey: 'jsonTemplate',
        language: 'json',
        theme: 'prompt-interpolation',
      },
    ];
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Creates an object from input values and a JSON template, escaping the input values and inserting them into the template.

        Use double-quotes around the input values to escape them. String values are automatically escaped.

        Useful for creating objects from multiple inputs.
      `,
      infoBoxTitle: 'Object Node',
      contextMenuTitle: 'Object',
      group: ['Objects'],
    };
  }

  interpolate(baseString: string, values: Record<string, any>): string {
    return baseString.replace(/("?)\{\{([^}]+)\}\}("?)/g, (_m, openQuote, key, _closeQuote) => {
      const isQuoted = Boolean(openQuote);
      const value = values[key];
      if (value == null) {
        return 'null';
      }
      if (isQuoted && typeof value === 'string') {
        // Adds double-quotes back.
        return JSON.stringify(value);
      }
      if (isQuoted) {
        // Non-strings require a double-stringify, first to turn them into a string, then to escape that string and add quotes.
        return JSON.stringify(JSON.stringify(value));
      }
      // Otherwise, it was not quoted, so no need to double-stringify
      return JSON.stringify(value);
    });
  }

  async process(inputs: Record<string, DataValue>): Promise<Record<string, DataValue>> {
    const inputMap = Object.keys(inputs).reduce((acc, key) => {
      acc[key] = (inputs[key] as any)?.value;
      return acc;
    }, {} as Record<string, any>);

    const outputValue = JSON.parse(this.interpolate(this.chartNode.data.jsonTemplate, inputMap)) as Record<
      string,
      unknown
    >;

    return {
      output: {
        type: 'object',
        value: outputValue,
      },
    };
  }
}

export const objectNode = nodeDefinition(ObjectNodeImpl, 'Object');
