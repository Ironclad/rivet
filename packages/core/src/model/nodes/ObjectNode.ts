import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase.js';
import { nanoid } from 'nanoid';
import { EditorDefinition, NodeImpl, nodeDefinition } from '../NodeImpl.js';
import { coerceTypeOptional } from '../../utils/coerceType.js';
import { DataValue } from '../DataValue.js';

export type ObjectNode = ChartNode<'object', ObjectNodeData>;

export type ObjectNodeData = {
  jsonTemplate: string;
  removeEmpty: boolean;
};

const DEFAULT_JSON_TEMPLATE = `{
  "key": "{{input}}"
}`

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
        removeEmpty: false,
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
        dataType: 'object',
        id: 'output' as PortId,
        title: 'Output',
      },
    ];
  }

  getEditors(): EditorDefinition<ObjectNode>[] {
    return [
      { type: 'toggle', label: 'Remove Empty Properties?', dataKey: 'removeEmpty' },
      {
        type: 'code',
        label: 'JSON Template',
        dataKey: 'jsonTemplate',
        language: 'json',
        theme: 'prompt-interpolation',
      },
    ];
  }

  interpolate(baseString: string, values: Record<string, any>): string {
    return baseString.replace(/"?\{\{([^}]+)\}\}"?/g, (_m, p1) => {
      const value = values[p1];
      return value !== undefined ? value.toString() : '';
    });
  }

  async process(inputs: Record<string, DataValue>): Promise<Record<string, DataValue>> {
    const inputMap = Object.keys(inputs).reduce((acc, key) => {
      const stringValue = coerceTypeOptional(inputs[key], 'string') ?? undefined;

      // Make string JSON-safe.
      acc[key] = stringValue ? JSON.stringify(stringValue) : undefined;
      return acc;
    }, {} as Record<string, string | undefined>);

    const outputValue = JSON.parse(this.interpolate(this.chartNode.data.jsonTemplate, inputMap)) as Record<string, unknown>;

    return {
      output: {
        type: 'object',
        value: outputValue,
      },
    };
  }
}

export const objectNode = nodeDefinition(ObjectNodeImpl, 'Object');
