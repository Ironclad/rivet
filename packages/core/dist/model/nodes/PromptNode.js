import { nanoid } from 'nanoid';
import { NodeImpl, nodeDefinition } from '../NodeImpl';
import { coerceType } from '../..';
import { mapValues } from 'lodash-es';
export class PromptNodeImpl extends NodeImpl {
    static create(promptText = '{{input}}') {
        const chartNode = {
            type: 'prompt',
            title: 'Prompt',
            id: nanoid(),
            visualData: {
                x: 0,
                y: 0,
                width: 250,
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
        let inputs = [];
        if (this.data.useTypeInput) {
            inputs.push({
                id: 'type',
                title: 'Type',
                dataType: 'string',
            });
        }
        if (this.data.useNameInput) {
            inputs.push({
                id: 'name',
                title: 'Name',
                dataType: 'string',
            });
        }
        // Extract inputs from promptText, everything like {{input}}
        const inputNames = this.chartNode.data.promptText.match(/\{\{([^}]+)\}\}/g);
        inputs = [
            ...inputs,
            ...(inputNames?.map((inputName) => {
                return {
                    // id and title should not have the {{ and }}
                    id: inputName.slice(2, -2),
                    title: inputName.slice(2, -2),
                    dataType: 'string',
                    required: false,
                };
            }) ?? []),
        ];
        return inputs;
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
    getEditors() {
        return [
            {
                type: 'dropdown',
                label: 'Type',
                options: [
                    { value: 'system', label: 'System' },
                    { value: 'user', label: 'User' },
                    { value: 'assistant', label: 'Assistant' },
                    { value: 'tool', label: 'Tool' },
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
                type: 'code',
                label: 'Prompt Text',
                dataKey: 'promptText',
                language: 'prompt-interpolation',
                theme: 'prompt-interpolation',
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
            ['output']: {
                type: 'chat-message',
                value: {
                    type: this.chartNode.data.type,
                    message: outputValue,
                },
            },
        };
    }
}
export const promptNode = nodeDefinition(PromptNodeImpl, 'Prompt');
