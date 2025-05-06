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
import type { InternalProcessContext } from '../ProcessContext.js';
import { resolveExpressionRawValue, unwrapPotentialDataValue } from '../../utils/interpolation.js';

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
    // Provide default empty string for jsonTemplate if undefined
    const jsonTemplate = this.chartNode.data.jsonTemplate ?? '';
    const matches = jsonTemplate.match(/\{\{([^}]+?)\}\}/g); // matches is string[] | null
    const allTokens = matches ?? []; // allTokens is now explicitly string[]
    const inputTokens = allTokens
      // id and title should not have the {{ and }}
      .map((token) => token.slice(2, -2).trim())
      .filter((tokenContent) => !tokenContent.startsWith('@graphInputs.') && !tokenContent.startsWith('@context.'))
      .filter((token) => token !== '');

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
    graphInputNodeValues?: Record<string, DataValue>,
    contextValues?: Record<string, DataValue>
  ): string {
    return baseString.replace(/("?)\{\{([^}]+?)\}\}("?)/g, (_m, openQuote, key, _closeQuote) => {
      const isQuoted = Boolean(openQuote);
      const trimmedKey = key.trim(); // Use trimmedKey for lookups

      let value: any;

      const graphInputPrefix = '@graphInputs.';
      const contextPrefix = '@context.';

      if (trimmedKey.startsWith(graphInputPrefix) && graphInputNodeValues) {
        value = resolveExpressionRawValue(
          graphInputNodeValues,
          trimmedKey.substring(graphInputPrefix.length),
          'graphInputs'
        );
      } else if (trimmedKey.startsWith(contextPrefix) && contextValues) {
        value = resolveExpressionRawValue(
          contextValues,
          trimmedKey.substring(contextPrefix.length),
          'context'
        );
      } else {
        value = values[trimmedKey]; // Original logic for non-@ variables
      }

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

  async process(inputs: Record<string, DataValue>, context: InternalProcessContext): Promise<Record<string, DataValue>> {
    const inputMap = Object.keys(inputs).reduce(
      (acc, key) => {
        acc[key] = unwrapPotentialDataValue(inputs[key]);
        return acc;
      },
      {} as Record<string, any>,
    );

    const interpolatedString = this.interpolate(
      this.chartNode.data.jsonTemplate,
      inputMap,
      context.graphInputNodeValues, // Pass graph inputs
      context.contextValues // Pass context values
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
      } as DataValue,
    };
  }
}

export const objectNode = nodeDefinition(ObjectNodeImpl, 'Object');
