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
import { dedent } from 'ts-dedent';
import { type EditorDefinition } from '../EditorDefinition.js';
import { type NodeBodySpec } from '../NodeBodySpec.js';
import { interpolate } from '../../utils/interpolation.js';
import type { Inputs, Outputs } from '../GraphProcessor.js';
import { keys } from '../../utils/typeSafety.js';
import { coerceTypeOptional, coerceType } from '../../utils/coerceType.js';
import { getInputOrData } from '../../utils/index.js';

export type GptFunctionNode = ChartNode<'gptFunction', GptFunctionNodeData>;

export type GptFunctionNodeData = {
  name: string;
  useNameInput?: boolean;

  description: string;
  useDescriptionInput?: boolean;

  schema: string;
  useSchemaInput?: boolean;
};

export class GptFunctionNodeImpl extends NodeImpl<GptFunctionNode> {
  static create(): GptFunctionNode {
    const chartNode: GptFunctionNode = {
      type: 'gptFunction',
      title: 'GPT Function',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 250,
      },
      data: {
        name: 'newFunction',
        description: 'No description provided',
        schema: dedent`
          {
            "type": "object",
            "properties": {}
          }`,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    let inputs: NodeInputDefinition[] = [];

    if (this.data.useNameInput) {
      inputs.push({
        id: 'name' as PortId,
        title: 'Name',
        dataType: 'string',
        description: 'The name of the function that GPT will see as available to call',
      });
    }

    if (this.data.useDescriptionInput) {
      inputs.push({
        id: 'description' as PortId,
        title: 'Description',
        dataType: 'string',
        description: 'The description of the function that GPT will see as available to call',
      });
    }

    if (this.data.useSchemaInput) {
      inputs.push({
        id: 'schema' as PortId,
        title: 'Schema',
        dataType: 'object',
        description: 'The schema of the function that GPT will see as available to call',
      });
    }

    // Extract inputs from promptText, everything like {{input}}
    const inputNames = this.data.useSchemaInput ? [] : [...new Set(this.data.schema.match(/\{\{([^}]+)\}\}/g))];
    inputs = [
      ...inputs,
      ...(inputNames?.map((inputName): NodeInputDefinition => {
        const name = inputName.slice(2, -2);
        return {
          // id and title should not have the {{ and }}
          id: `input-${name}` as PortId,
          title: name,
          dataType: 'string',
          description: `An interpolated value in the schema named '${name}'`,
        };
      }) ?? []),
    ];

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'function' as PortId,
        title: 'Function',
        dataType: 'gpt-function',
        description: 'The GPT function that can be called by the LLM.',
      },
    ];
  }

  getEditors(): EditorDefinition<GptFunctionNode>[] {
    return [
      {
        type: 'string',
        label: 'Name',
        dataKey: 'name',
        useInputToggleDataKey: 'useNameInput',
      },
      {
        type: 'string',
        label: 'Description',
        dataKey: 'description',
        useInputToggleDataKey: 'useDescriptionInput',
      },
      {
        type: 'code',
        label: 'Schema',
        dataKey: 'schema',
        language: 'json',
        useInputToggleDataKey: 'useSchemaInput',
      },
    ];
  }

  getBody(): string | NodeBodySpec | undefined {
    return `!markdown_${this.data.name}_: ${this.data.description}`;
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Defines a GPT function, which is a method that the LLM can call in its responses.
      `,
      infoBoxTitle: 'GPT Function Node',
      contextMenuTitle: 'GPT Function',
      group: ['AI'],
    };
  }

  async process(inputs: Inputs): Promise<Outputs> {
    const name = getInputOrData(this.data, inputs, 'name');
    const description = getInputOrData(this.data, inputs, 'description');

    let schema: unknown;
    if (this.data.useSchemaInput) {
      schema = coerceType(inputs['schema' as PortId], 'object');
    } else {
      const inputMap = keys(inputs)
        .filter((key) => key.startsWith('input'))
        .reduce((acc, key) => {
          const stringValue = coerceTypeOptional(inputs[key], 'string') ?? '';

          const interpolationKey = key.slice('input-'.length);
          acc[interpolationKey] = stringValue;
          return acc;
        }, {} as Record<string, string>);

      const interpolated = interpolate(this.data.schema, inputMap);

      schema = JSON.parse(interpolated);
    }

    return {
      ['function' as PortId]: {
        type: 'gpt-function',
        value: {
          name,
          description,
          parameters: schema as object,
        },
      },
    };
  }
}

export const gptFunctionNode = nodeDefinition(GptFunctionNodeImpl, 'GPT Function');
