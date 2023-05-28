import { nanoid } from 'nanoid';
import { NodeImpl } from '../NodeImpl';
import { coerceType } from '../..';
import { mapValues } from 'lodash-es';
export class PromptNodeImpl extends NodeImpl {
    static create(promptText = 'Hello {{name}}!') {
        const chartNode = {
            type: 'prompt',
            title: 'Prompt',
            id: nanoid(),
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
    getInputDefinitions() {
        // Extract inputs from promptText, everything like {{input}}
        const inputNames = this.chartNode.data.promptText.match(/\{\{([^}]+)\}\}/g);
        return (inputNames?.map((inputName) => {
            return {
                type: 'string',
                // id and title should not have the {{ and }}
                id: inputName.slice(2, -2),
                title: inputName.slice(2, -2),
                dataType: 'string',
                required: false,
            };
        }) ?? []);
    }
    getOutputDefinitions() {
        return [
            {
                id: 'output',
                title: 'Output',
                dataType: 'chat-message',
            },
        ];
    }
    interpolate(baseString, values) {
        return baseString.replace(/\{\{([^}]+)\}\}/g, (_m, p1) => {
            const value = values[p1];
            return value !== undefined ? value : '';
        });
    }
    async process(inputs) {
        const inputMap = mapValues(inputs, (input) => coerceType(input, 'string'));
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
