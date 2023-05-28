import { nanoid } from 'nanoid';
import { NodeImpl } from '../NodeImpl';
import { expectType } from '../..';
export class ExtractJsonNodeImpl extends NodeImpl {
    static create() {
        const chartNode = {
            type: 'extractJson',
            title: 'Extract JSON',
            id: nanoid(),
            visualData: {
                x: 0,
                y: 0,
                width: 250,
            },
            data: {},
        };
        return chartNode;
    }
    getInputDefinitions() {
        return [
            {
                id: 'input',
                title: 'Input',
                dataType: 'string',
                required: true,
            },
        ];
    }
    getOutputDefinitions() {
        return [
            {
                id: 'output',
                title: 'Output',
                dataType: 'object',
            },
            {
                id: 'noMatch',
                title: 'No Match',
                dataType: 'string',
            },
        ];
    }
    async process(inputs) {
        const inputString = expectType(inputs['input'], 'string');
        const firstBracket = inputString.indexOf('{');
        const lastBracket = inputString.lastIndexOf('}');
        const firstSquareBracket = inputString.indexOf('[');
        const lastSquareBracket = inputString.lastIndexOf(']');
        const firstIndex = Math.min(firstBracket, firstSquareBracket);
        const lastIndex = Math.max(lastBracket, lastSquareBracket);
        const substring = inputString.substring(firstIndex, lastIndex + 1);
        let jsonObject = undefined;
        try {
            jsonObject = JSON.parse(substring);
        }
        catch (err) {
            return {
                ['noMatch']: {
                    type: 'string',
                    value: inputString,
                },
                ['output']: {
                    type: 'control-flow-excluded',
                    value: undefined,
                },
            };
        }
        return {
            ['output']: {
                type: 'object',
                value: jsonObject,
            },
            ['noMatch']: {
                type: 'control-flow-excluded',
                value: undefined,
            },
        };
    }
}
