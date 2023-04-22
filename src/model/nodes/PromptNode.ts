import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { nanoid } from 'nanoid';
import { NodeImpl } from '../NodeImpl';

export type PromptNode = ChartNode<'prompt', PromptNodeData>;

export type PromptNodeData = {
  type: 'system' | 'user' | 'ai';
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

  interpolate(baseString: string, values: Record<string, any>): string {
    return baseString.replace(/\{\{([^}]+)\}\}/g, (_m, p1) => {
      const value = values[p1.trim()];
      return value !== undefined ? value.toString() : '';
    });
  }

  async process(inputs: Record<string, any>): Promise<Record<string, any>> {
    const inputMap = Object.keys(inputs).reduce((acc, key) => {
      acc[key] = inputs[key];
      return acc;
    }, {} as Record<string, any>);

    const outputValue = this.interpolate(this.chartNode.data.promptText, inputMap);

    return {
      output: {
        type: this.chartNode.data.type,
        text: outputValue,
      },
    };
  }
}
