import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { nanoid } from 'nanoid';
import { NodeImpl } from '../NodeImpl';
import { DataValue } from '../DataValue';
import { match } from 'ts-pattern';

export type PromptNode = ChartNode<'prompt', PromptNodeData>;

export type PromptNodeData = {
  type: 'system' | 'user' | 'assistant';
  useTypeInput: boolean;
  promptText: string;
};

export class PromptNodeImpl extends NodeImpl<PromptNode> {
  static create(promptText: string = 'Hello {{name}}!'): PromptNode {
    const chartNode: PromptNode = {
      type: 'prompt',
      title: 'Prompt',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
      },
      data: {
        type: 'user',
        useTypeInput: false,
        promptText,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    // Extract inputs from promptText, everything like {{input}}
    const inputNames = this.chartNode.data.promptText.match(/\{\{([^}]+)\}\}/g);
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
        dataType: 'chat-message',
      },
    ];
  }

  interpolate(baseString: string, values: Record<string, string>): string {
    return baseString.replace(/\{\{([^}]+)\}\}/g, (_m, p1) => {
      const value = values[p1.trim()];
      return value !== undefined ? value : '';
    });
  }

  async process(inputs: Record<string, DataValue>): Promise<Record<string, DataValue>> {
    const inputMap = Object.keys(inputs).reduce((acc, key) => {
      const stringValue = match(inputs[key])
        .with({ type: 'boolean' }, (v) => v.value.toString())
        .with({ type: 'number' }, (v) => v.value.toString())
        .with({ type: 'string' }, (v) => v.value)
        .with({ type: 'string[]' }, (v) => v.value.join(', ')) // TODO \n? customizable?
        .otherwise(() => '');

      acc[key] = stringValue;
      return acc;
    }, {} as Record<string, any>);

    const outputValue = this.interpolate(this.chartNode.data.promptText, inputMap);

    return {
      output: {
        type: 'chat-message',
        value: {
          type: this.chartNode.data.type,
          message: outputValue,
        },
      },
    };
  }
}
