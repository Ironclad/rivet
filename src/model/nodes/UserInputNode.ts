import { NodeImpl } from '../NodeImpl';
import { ChartNode, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase';
import { nanoid } from 'nanoid';
import { DataType, DataValue } from '../DataValue';

export type UserInputNode = ChartNode<'userInput', UserInputNodeData>;

export type UserInputNodeData = {
  prompt: string;
  useInput: boolean;
};

export class UserInputNodeImpl extends NodeImpl<UserInputNode> {
  static create(prompt = ''): UserInputNode {
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
        useInput: false,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    if (this.chartNode.data.useInput) {
      return [
        {
          dataType: 'string[]',
          id: 'questions' as PortId,
          title: 'Questions',
        },
      ];
    }
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

  async process(inputs: Record<string, any>): Promise<Record<string, any>> {
    if (this.chartNode.data.useInput) {
      return {
        output: inputs.questions,
      };
    }
    return {
      output: null,
    };
  }
}
