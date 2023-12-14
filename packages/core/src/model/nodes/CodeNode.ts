import {
  type ChartNode,
  type NodeId,
  type NodeInputDefinition,
  type PortId,
  type NodeOutputDefinition,
} from '../NodeBase.js';
import { nanoid } from 'nanoid/non-secure';
import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import { type DataValue } from '../DataValue.js';
import { dedent } from 'ts-dedent';
import { type EditorDefinition } from '../EditorDefinition.js';
import { type NodeBodySpec } from '../NodeBodySpec.js';
import { nodeDefinition } from '../NodeDefinition.js';

export type CodeNode = ChartNode<'code', CodeNodeData>;

const maskInput = (name: string) => name.trim().replace(/[^a-zA-Z0-9_]/g, '_');
const asValidNames = (names: string[]): string[] => Array(...new Set(names.map(maskInput))).filter(Boolean);

export type CodeNodeData = {
  code: string;
  inputNames: string | string[];
  outputNames: string | string[];
};

export class CodeNodeImpl extends NodeImpl<CodeNode> {
  static create(): CodeNode {
    const chartNode: CodeNode = {
      type: 'code',
      title: 'Code',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
      },
      data: {
        code: dedent`
          // This is a code node, you can write and JS in here and it will be executed.
          // Inputs are accessible via an object \`inputs\` and data is typed (i.e. inputs.foo.type, inputs.foo.value)
          // Return an object with named outputs that match the output names specified in the node's config.
          // Output values must by typed as well (e.g. { bar: { type: 'string', value: 'bar' } }
          return {
            output1: {
              type: inputs.input1.type,
              value: inputs.input1.value
            }
          };
        `,
        inputNames: 'input1',
        outputNames: 'output1',
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputNames = this.data.inputNames
      ? Array.isArray(this.data.inputNames)
        ? this.data.inputNames
        : [this.data.inputNames]
      : [];

    return asValidNames(inputNames).map((inputName) => {
      return {
        type: 'any',
        id: inputName.trim() as PortId,
        title: inputName.trim(),
        dataType: 'string',
        required: false,
      };
    });
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    const outputNames = this.data.outputNames
      ? Array.isArray(this.data.outputNames)
        ? this.data.outputNames
        : [this.data.outputNames]
      : [];

    return asValidNames(outputNames).map((outputName) => {
      return {
        id: outputName.trim() as PortId,
        title: outputName.trim(),
        dataType: 'any',
      };
    });
  }

  getEditors(): EditorDefinition<CodeNode>[] {
    return [
      {
        type: 'custom',
        customEditorId: 'CodeNodeAIAssist',
        label: 'AI Assist',
      },
      {
        type: 'code',
        label: 'Code',
        dataKey: 'code',
        language: 'javascript',
      },
      {
        type: 'stringList',
        label: 'Inputs',
        dataKey: 'inputNames',
      },
      {
        type: 'stringList',
        label: 'Outputs',
        dataKey: 'outputNames',
      },
    ];
  }

  getBody(): string | NodeBodySpec | undefined {
    const trimmed = this.data.code
      .split('\n')
      .slice(0, 15)
      .map((line) => (line.length > 50 ? line.slice(0, 50) + '...' : line))
      .join('\n')
      .trim();

    return {
      type: 'colorized',
      text: trimmed,
      language: 'javascript',
      fontSize: 12,
      fontFamily: 'monospace',
    };
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Executes a piece of JavaScript code. See the Rivet Documentation for more information on how to write code for the Code Node.
      `,
      infoBoxTitle: 'Code Node',
      contextMenuTitle: 'Code',
      group: ['Advanced'],
    };
  }

  async process(inputs: Record<string, DataValue>): Promise<Record<string, DataValue>> {
    // eslint-disable-next-line no-new-func
    const codeFunction = new Function('inputs', this.chartNode.data.code);
    const outputs = codeFunction(inputs);

    if (outputs == null || typeof outputs !== 'object' || ('then' in outputs && typeof outputs.then === 'function')) {
      throw new Error('Code node must return an object with output values.');
    }

    const missingOutputs = this.getOutputDefinitions().filter((output) => !(output.id in outputs));
    if (missingOutputs.length > 0) {
      throw new Error(
        `Code node must return an object with output values for all outputs. To not run an output, return { "type": "control-flow-excluded", "value": undefiend }. To return undefined, return { "type": "any", "value": undefined }. Missing: ${missingOutputs
          .map((output) => output.id)
          .join(', ')}`,
      );
    }

    return outputs;
  }
}

export const codeNode = nodeDefinition(CodeNodeImpl, 'Code');
