import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase.js';
import { nanoid } from 'nanoid';
import { NodeImpl, NodeUIData, nodeDefinition } from '../NodeImpl.js';
import { DataValue } from '../DataValue.js';
import { dedent } from 'ts-dedent';
import { EditorDefinition } from '../EditorDefinition.js';
import { NodeBodySpec } from '../NodeBodySpec.js';

export type CodeNode = ChartNode<'code', CodeNodeData>;

export type CodeNodeData = {
  code: string;
  inputNames: string;
  outputNames: string;
};

export class CodeNodeImpl extends NodeImpl<CodeNode> {
  static create(
    code: string = `// This is a code node, you can write and JS in here and it will be executed.
// Inputs are accessible via an object \`inputs\` and data is typed (i.e. inputs.foo.type, inputs.foo.value)
// Return an object with named outputs that match the output names specified in the node's config.
// Output values must by typed as well (e.g. { bar: { type: 'string', value: 'bar' } }
return { output: inputs.input };`,
    inputNames: string = 'input',
    outputNames: string = 'output',
  ): CodeNode {
    const chartNode: CodeNode = {
      type: 'code',
      title: 'Code',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
      },
      data: {
        code,
        inputNames,
        outputNames,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    return this.chartNode.data.inputNames.split(',').map((inputName) => {
      return {
        type: 'string',
        id: inputName.trim() as PortId,
        title: inputName.trim(),
        dataType: 'string',
        required: false,
      };
    });
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return this.chartNode.data.outputNames.split(',').map((outputName) => {
      return {
        id: outputName.trim() as PortId,
        title: outputName.trim(),
        dataType: 'string',
      };
    });
  }

  getEditors(): EditorDefinition<CodeNode>[] {
    return [
      {
        type: 'code',
        label: 'Code',
        dataKey: 'code',
        language: 'javascript',
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
        Executes a piece of JavaScript code. Documentation for the inputs and outputs is available in the default code.
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
    return outputs;
  }
}

export const codeNode = nodeDefinition(CodeNodeImpl, 'Code');
