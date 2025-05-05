import {
  type ChartNode,
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
import get from 'lodash-es/get.js';
import type { InternalProcessContext } from '../ProcessContext.js';

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

  getInputDefinitions(): NodeInputDefinition[] {
    const allTokens = this.chartNode.data.jsonTemplate.match(/\{\{([^}]+?)\}\}/g) ?? [];
    const inputTokens = allTokens
      .map((token) => token.slice(2, -2).trim()) // Get content inside braces and trim
      .filter((tokenContent) => !tokenContent.startsWith('@input.')); // Filter out @input tokens

    return [...new Set(inputTokens)].map((inputName) => {
      return {
        id: inputName as PortId,
        title: inputName,
        dataType: 'any',
        required: false,
      };
    });
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        dataType: ['object', 'object[]'],
        id: 'output' as PortId,
        title: 'Output',
      },
    ];
  }

  getEditors(): EditorDefinition<ObjectNode>[] {
    return [
      {
        type: 'custom',
        customEditorId: 'ObjectNodeAiAssist',
        label: 'AI Assist',
      },
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

  interpolate(
    baseString: string,
    values: Record<string, any>,
    graphInputNodeValues?: Record<string, DataValue>
  ): string {
    return baseString.replace(/("?)\{\{([^}]+?)\}\}("?)/g, (_m, openQuote, key, _closeQuote) => {
      const isQuoted = Boolean(openQuote);
      const trimmedKey = key.trim();
      let resolvedValue: any;

      const graphInputPrefix = '@input.';
      if (trimmedKey.startsWith(graphInputPrefix) && graphInputNodeValues) {
        let expression = trimmedKey.substring(graphInputPrefix.length);
        // Clean up expression: remove spaces around dots and brackets
        expression = expression.replace(/\s*\.\s*/g, '.').replace(/\s*\[\s*/g, '[').replace(/\s*\]\s*/g, ']');
        resolvedValue = get(graphInputNodeValues, expression)?.value; // Get the .value property
      } else {
        resolvedValue = values[trimmedKey];
      }

      if (resolvedValue == null) {
        return 'null';
      }
      if (isQuoted && typeof resolvedValue === 'string') {
        return JSON.stringify(resolvedValue);
      }
      if (isQuoted) {
        return JSON.stringify(JSON.stringify(resolvedValue));
      }
      return JSON.stringify(resolvedValue);
    });
  }

  async process(inputs: Record<string, DataValue>, context: InternalProcessContext): Promise<Record<string, DataValue>> {
    const inputMap = Object.keys(inputs).reduce(
      (acc, key) => {
        acc[key] = (inputs[key] as any)?.value;
        return acc;
      },
      {} as Record<string, any>,
    );

    // Pass context.graphInputNodeValues as the third argument
    const interpolatedString = this.interpolate(
      this.chartNode.data.jsonTemplate,
      inputMap,
      context.graphInputNodeValues // <-- Add this
    );

    let outputValue: Record<string, unknown> | unknown[];

    try {
      outputValue = JSON.parse(interpolatedString) as Record<string, unknown> | unknown[];
    } catch (err) {
      throw new Error(`Failed to parse JSON template: ${(err as Error).message}`);
    }

    const outputType = Array.isArray(outputValue) ? 'object[]' : 'object';

    return {
      output: {
        type: outputType,
        value: outputValue,
      } as DataValue, // Explicitly assert type to satisfy TS
    };
  }
}

export const objectNode = nodeDefinition(ObjectNodeImpl, 'Object');
