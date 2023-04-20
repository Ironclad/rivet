import { NodeImpl } from '../NodeImpl';
import { ChartNode, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase';
import { nanoid } from 'nanoid';
import { DataType } from '../DataValue';

export type UserInputNode = ChartNode<'userInput', UserInputNodeData>;

export type UserInputNodeData = {
  prompt: string;
};

export class UserInputNodeImpl extends NodeImpl<UserInputNode> {
  static create(prompt = '', inputType: DataType = 'string'): UserInputNode {
    const chartNode: UserInputNode = {
      type: 'userInput',
      title: 'User Input',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
      },
      data: {
        prompt,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    return [];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        dataType: 'string',
        id: 'output' as PortId,
        title: 'User Input',
      },
    ];
  }

  async getUserInput(): Promise<Record<string, any>> {
    const input = prompt(this.chartNode.data.prompt);
    return {
      output: input,
    };
  }

  async process(inputs: Record<string, any>): Promise<Record<string, any>> {
    return this.getUserInput();
  }
}
