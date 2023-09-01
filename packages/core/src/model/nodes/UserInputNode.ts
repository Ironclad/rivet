import { NodeImpl, NodeUIData, nodeDefinition } from '../NodeImpl.js';
import { ChartNode, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase.js';
import { nanoid } from 'nanoid';
import { DataValue, StringArrayDataValue } from '../DataValue.js';
import { zip } from 'lodash-es';
import { Outputs, Inputs, expectType, EditorDefinition, NodeBodySpec } from '../../index.js';
import { dedent } from 'ts-dedent';

export type UserInputNode = ChartNode<'userInput', UserInputNodeData>;

export type UserInputNodeData = {
  prompt: string;

  type: 'string' | 'audio';
  useInput: boolean;
};

export class UserInputNodeImpl extends NodeImpl<UserInputNode> {
  static create(prompt = 'This is an example question?'): UserInputNode {
    const chartNode: UserInputNode = {
      type: 'userInput',
      title: 'User Input',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 250,
      },
      data: {
        prompt,
        type: 'string',
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
    if (this.data.type === 'string') {
      return [
        {
          dataType: 'string[]',
          id: 'output' as PortId,
          title: 'Answers Only',
        },
        {
          dataType: 'string[]',
          id: 'questionsAndAnswers' as PortId,
          title: 'Q & A',
        },
      ];
    } else {
      return [
        {
          dataType: 'audio',
          id: 'output' as PortId,
          title: 'Audio',
        },
      ];
    }
  }

  getEditors(): EditorDefinition<UserInputNode>[] {
    return [
      {
        type: 'dropdown',
        label: 'Type',
        dataKey: 'type',
        options: [
          { value: 'string', label: 'String' },
          { value: 'audio', label: 'Audio' },
        ],
      },
      {
        type: 'code',
        label: 'Prompt',
        dataKey: 'prompt',
        useInputToggleDataKey: 'useInput',
        language: 'plain-text',
      },
    ];
  }

  getBody(): string | NodeBodySpec | undefined {
    return dedent`
      ${this.data.type === 'string' ? '' : 'Audio\n'}${this.data.useInput ? 'Questions:' : 'Prompt:'} ${
      this.data.prompt
    }
    `;
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Prompts the user for input during the execution of the graph. The user's response becomes the output of this node.
      `,
      infoBoxTitle: 'User Input Node',
      contextMenuTitle: 'User Input',
      group: ['Input/Output'],
    };
  }

  async process(): Promise<Outputs> {
    return {
      ['output' as PortId]: undefined!,
      ['questionsAndAnswers' as PortId]: undefined!,
    };
  }

  getOutputValuesFromUserInput(questions: Inputs, answers: DataValue): Outputs {
    const questionsList = this.data.useInput
      ? expectType(questions['questions' as PortId], 'string[]')
      : [this.data.prompt];

    if (this.data.type === 'string') {
      return {
        ['output' as PortId]: answers,
        ['questionsAndAnswers' as PortId]: {
          type: 'string[]',
          value: zip(questionsList, (answers as StringArrayDataValue).value).map(([q, a]) => `${q}\n${a}`),
        },
      };
    } else if (this.data.type === 'audio') {
      return {
        ['output' as PortId]: answers,
      };
    }

    throw new Error(`Unknown type: ${this.data.type}`);
  }
}

export const userInputNode = nodeDefinition(UserInputNodeImpl, 'User Input');
