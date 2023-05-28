import { nanoid } from 'nanoid';
import { NodeImpl } from '../NodeImpl';
export class PopNodeImpl extends NodeImpl {
    static create() {
        const baseNode = {
            type: 'pop',
            title: 'Pop',
            id: nanoid(),
            visualData: {
                x: 0,
                y: 0,
                width: 200,
            },
            data: {},
        };
        return baseNode;
    }
    getInputDefinitions() {
        return [
            {
                dataType: 'any[]',
                id: 'array',
                title: 'Array',
            },
        ];
    }
    getOutputDefinitions() {
        return [
            {
                dataType: 'any',
                id: 'lastItem',
                title: 'Last',
            },
            {
                dataType: 'any',
                id: 'restOfArray',
                title: 'Rest',
            },
        ];
    }
    async process(inputs) {
        const inputArray = inputs['array']?.value;
        if (!Array.isArray(inputArray) || inputArray.length === 0) {
            throw new Error('Input array is empty or not an array');
        }
        const lastItem = inputArray[inputArray.length - 1];
        const rest = inputArray.slice(0, inputArray.length - 1);
        return {
            ['lastItem']: {
                type: 'any',
                value: lastItem,
            },
            ['restOfArray']: {
                type: 'any[]',
                value: rest,
            },
        };
    }
}
