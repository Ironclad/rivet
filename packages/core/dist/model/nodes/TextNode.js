import { nanoid } from 'nanoid';
import { NodeImpl } from '../NodeImpl';
import { coerceTypeOptional } from '../..';
export class TextNodeImpl extends NodeImpl {
    static create(text = '{{input}}') {
        const chartNode = {
            type: 'text',
            title: 'Text',
            id: nanoid(),
            visualData: {
                x: 0,
                y: 0,
                width: 300,
            },
            data: {
                text,
            },
        };
        return chartNode;
    }
    getInputDefinitions() {
        // Extract inputs from text, everything like {{input}}
        const inputNames = [...new Set(this.chartNode.data.text.match(/\{\{([^}]+)\}\}/g))];
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
                dataType: 'string',
            },
        ];
    }
    interpolate(baseString, values) {
        return baseString.replace(/\{\{([^}]+)\}\}/g, (_m, p1) => {
            const value = values[p1];
            return value !== undefined ? value.toString() : '';
        });
    }
    async process(inputs) {
        const inputMap = Object.keys(inputs).reduce((acc, key) => {
            const stringValue = coerceTypeOptional(inputs[key], 'string') ?? '';
            acc[key] = stringValue;
            return acc;
        }, {});
        const outputValue = this.interpolate(this.chartNode.data.text, inputMap);
        return {
            output: {
                type: 'string',
                value: outputValue,
            },
        };
    }
}
