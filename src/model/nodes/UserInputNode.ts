import { NodeImpl } from '../NodeImpl';
import { ChartNode, NodeId, NodeInputDefinition, NodeOutputDefinition, NodeOutputId } from '../NodeBase';
import { nanoid } from 'nanoid';

export type UserInputNode = ChartNode<'userInput', UserInputNodeData>;

export type UserInputNodeData = {
  prompt: string;
  inputType: 'text' | 'number' | 'email' | 'date' | 'time';
};

export class UserInputNodeImpl extends NodeImpl<UserInputNode> {
  constructor(node: UserInputNode) {
    super(node);
  }

  static create(prompt = '', inputType: UserInputNodeData['inputType'] = 'text'): UserInputNodeImpl {
    const inputDefinitions: NodeInputDefinition[] = [];
    const outputDefinitions: NodeOutputDefinition[] = [
      {
        type: inputType,
        id: 'output' as NodeOutputId,
        title: 'User Input',
      },
    ];

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
        inputType,
      },
      inputDefinitions,
      outputDefinitions,
      connections: [],
    };

    return new UserInputNodeImpl(chartNode);
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
