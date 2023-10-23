import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import type { ChartNode, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase.js';
import { nanoid } from 'nanoid/non-secure';
import type { ArrayDataValue, StringDataValue } from '../DataValue.js';
import { zip } from 'lodash-es';
import { type Outputs, type Inputs, type EditorDefinition, type NodeBodySpec } from '../../index.js';
import { dedent } from 'ts-dedent';
import { nodeDefinition } from '../NodeDefinition.js';
import { coerceType } from '../../utils/coerceType.js';

export type UserInputNode = ChartNode<'userInput', UserInputNodeData>;

export type UserInputNodeData = {
  prompt: string;
  useInput: boolean;

  renderingFormat?: 'preformatted' | 'markdown';
};

export class UserInputNodeImpl extends NodeImpl<UserInputNode> {
  static create(): UserInputNode {
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
        prompt: 'This is an example question?',
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
  }

  getEditors(): EditorDefinition<UserInputNode>[] {
    return [
      {
        type: 'code',
        label: 'Prompt',
        dataKey: 'prompt',
        useInputToggleDataKey: 'useInput',
        language: 'plain-text',
      },
      {
        type: 'group',
        label: 'Rendering',
        editors: [
          {
            type: 'dropdown',
            dataKey: 'renderingFormat',
            label: 'Format',
            options: [
              { label: 'Preformatted', value: 'preformatted' },
              { label: 'Markdown', value: 'markdown' },
            ],
            defaultValue: 'markdown',
          },
        ],
      },
    ];
  }

  getBody(): string | NodeBodySpec | undefined {
    return this.data.useInput ? '(Using input)' : this.data.prompt;
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

  getOutputValuesFromUserInput(questions: Inputs, answers: ArrayDataValue<StringDataValue>): Outputs {
    const questionsList = this.data.useInput
      ? coerceType(questions['questions' as PortId], 'string[]')
      : [this.data.prompt];

    return {
      ['output' as PortId]: answers,
      ['questionsAndAnswers' as PortId]: {
        type: 'string[]',
        value: zip(questionsList, answers.value).map(([q, a]) => `${q}\n${a}`),
      },
    };
  }
}

export const userInputNode = nodeDefinition(UserInputNodeImpl, 'User Input');
