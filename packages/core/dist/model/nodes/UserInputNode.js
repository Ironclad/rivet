import { NodeImpl } from '../NodeImpl';
import { nanoid } from 'nanoid';
import { zip } from 'lodash-es';
import { expectType } from '../..';
export class UserInputNodeImpl extends NodeImpl {
    static create(prompt = 'This is an example question?') {
        const chartNode = {
            type: 'userInput',
            title: 'User Input',
            id: nanoid(),
            visualData: {
                x: 0,
                y: 0,
                width: 250,
            },
            data: {
                prompt,
                useInput: false,
            },
        };
        return chartNode;
    }
    getInputDefinitions() {
        if (this.chartNode.data.useInput) {
            return [
                {
                    dataType: 'string[]',
                    id: 'questions',
                    title: 'Questions',
                },
            ];
        }
        return [];
    }
    getOutputDefinitions() {
        return [
            {
                dataType: 'string[]',
                id: 'output',
                title: 'Answers Only',
            },
            {
                dataType: 'string[]',
                id: 'questionsAndAnswers',
                title: 'Q & A',
            },
        ];
    }
    async process() {
        return {
            ['output']: undefined,
            ['questionsAndAnswers']: undefined,
        };
    }
    getOutputValuesFromUserInput(questions, answers) {
        const questionsList = this.data.useInput
            ? expectType(questions['questions'], 'string[]')
            : [this.data.prompt];
        return {
            ['output']: answers,
            ['questionsAndAnswers']: {
                type: 'string[]',
                value: zip(questionsList, answers.value).map(([q, a]) => `${q}\n${a}`),
            },
        };
    }
}
