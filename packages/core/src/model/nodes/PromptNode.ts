import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase.js';
import { nanoid } from 'nanoid';
import { NodeImpl, NodeUIData, nodeDefinition } from '../NodeImpl.js';
import { EditorDefinition, Inputs, NodeBodySpec, Outputs, coerceType } from '../../index.js';
import { mapValues } from 'lodash-es';
import { dedent } from 'ts-dedent';

export type PromptNode = ChartNode<'prompt', PromptNodeData>;

export type PromptNodeData = {
  type: 'system' | 'user' | 'assistant' | 'function';
  useTypeInput: boolean;

  promptText: string;

  name?: string;
  useNameInput?: boolean;
  enableFunctionCall?: boolean;
};

export class PromptNodeImpl extends NodeImpl<PromptNode> {
  static create(promptText: string = '{{input}}'): PromptNode {
    const chartNode: PromptNode = {
      type: 'prompt',
      title: 'Prompt',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 250,
      },
      data: {
        type: 'user',
        useTypeInput: false,
        promptText,
        enableFunctionCall: false,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    let inputs: NodeInputDefinition[] = [];

    if (this.data.enableFunctionCall) {
      inputs.push({
        id: 'function-call' as PortId,
        title: 'Function Call',
        dataType: 'object',
      });
    }

    if (this.data.useTypeInput) {
      inputs.push({
        id: 'type' as PortId,
        title: 'Type',
        dataType: 'string',
      });
    }

    if (this.data.useNameInput) {
      inputs.push({
        id: 'name' as PortId,
        title: 'Name',
        dataType: 'string',
      });
    }

    // Extract inputs from promptText, everything like {{input}}
    const inputNames = [...new Set(this.chartNode.data.promptText.match(/\{\{([^}]+)\}\}/g))];
    inputs = [
      ...inputs,
      ...(inputNames?.map((inputName): NodeInputDefinition => {
        return {
          // id and title should not have the {{ and }}
          id: inputName.slice(2, -2) as PortId,
          title: inputName.slice(2, -2),
          dataType: 'string',
          required: false,
        };
      }) ?? []),
    ];

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'output' as PortId,
        title: 'Output',
        dataType: 'chat-message',
      },
    ];
  }

  getEditors(): EditorDefinition<PromptNode>[] {
    return [
      {
        type: 'dropdown',
        label: 'Type',
        options: [
          { value: 'system', label: 'System' },
          { value: 'user', label: 'User' },
          { value: 'assistant', label: 'Assistant' },
          { value: 'function', label: 'Function' },
        ],
        dataKey: 'type',
        useInputToggleDataKey: 'useTypeInput',
      },
      {
        type: 'string',
        label: 'Name',
        dataKey: 'name',
        useInputToggleDataKey: 'useNameInput',
      },
      {
        type: 'toggle',
        label: 'Enable Function Call',
        dataKey: 'enableFunctionCall',
      },
      {
        type: 'code',
        label: 'Prompt Text',
        dataKey: 'promptText',
        language: 'prompt-interpolation-markdown',
        theme: 'prompt-interpolation',
      },
    ];
  }

  getBody(): string | NodeBodySpec | NodeBodySpec[] | undefined {
    return [
      {
        type: 'markdown',
        text: dedent`
          _${typeDisplay[this.data.type]}${this.data.name ? ` (${this.data.name})` : ''}_
      `,
      },
      {
        type: 'colorized',
        text: this.data.promptText.split('\n').slice(0, 15).join('\n').trim(),
        language: 'prompt-interpolation-markdown',
        theme: 'prompt-interpolation',
      },
    ];
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Outputs a chat message, which is a string of text with an attached "type" saying who sent the message (User, Assistant, System) and optionally an attached "name".

        Also provides the same <span style="color: var(--primary)">{{interpolation}}</span> capabilities as a Text node.

        Can change one chat message type into another chat message type. For example, changing a User message into a System message.
      `,
      infoBoxTitle: 'Prompt Node',
      contextMenuTitle: 'Prompt',
      group: ['Text'],
    };
  }

  interpolate(baseString: string, values: Record<string, string>): string {
    return baseString.replace(/\{\{([^}]+)\}\}/g, (_m, p1) => {
      const value = values[p1];
      return value !== undefined ? value : '';
    });
  }

  async process(inputs: Inputs): Promise<Outputs> {
    const inputMap = mapValues(inputs, (input) => coerceType(input, 'string')) as Record<PortId, string>;

    const outputValue = this.interpolate(this.chartNode.data.promptText, inputMap);

    return {
      ['output' as PortId]: {
        type: 'chat-message',
        value: {
          type: this.chartNode.data.type,
          message: outputValue,
          name: this.data.name,
          function_call: this.data.enableFunctionCall
            ? coerceType(inputs['function-call' as PortId], 'object')
            : undefined,
        },
      },
    };
  }
}

export const promptNode = nodeDefinition(PromptNodeImpl, 'Prompt');

const typeDisplay: Record<PromptNodeData['type'], string> = {
  assistant: 'Assistant',
  system: 'System',
  user: 'User',
  function: 'Function',
};
