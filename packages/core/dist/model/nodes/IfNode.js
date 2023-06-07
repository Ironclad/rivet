import { NodeImpl, nodeDefinition } from '../NodeImpl';
import { nanoid } from 'nanoid';
class IfNodeImpl extends NodeImpl {
    static create = () => {
        const chartNode = {
            type: 'if',
            title: 'If',
            id: nanoid(),
            data: {},
            visualData: {
                x: 0,
                y: 0,
                width: 100,
            },
        };
        return chartNode;
    };
    getInputDefinitions() {
        return [
            {
                id: 'if',
                title: 'If',
                dataType: 'string',
            },
            {
                id: 'value',
                title: 'Value',
                dataType: 'string',
            },
        ];
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
    async process(inputData) {
        const ifValue = inputData['if'];
        const value = inputData['value'] ?? { type: 'any', value: undefined };
        const excluded = {
            output: {
                type: 'control-flow-excluded',
                value: undefined,
            },
        };
        if (!ifValue) {
            return excluded;
        }
        if (ifValue.type === 'control-flow-excluded') {
            return excluded;
        }
        if (ifValue.type === 'string' && !ifValue.value) {
            return excluded;
        }
        if (ifValue.type === 'boolean' && !ifValue.value) {
            return excluded;
        }
        if (ifValue.type.endsWith('[]') && ifValue.value.length === 0) {
            return excluded;
        }
        return {
            ['output']: value,
        };
    }
}
export { IfNodeImpl };
export const ifNode = nodeDefinition(IfNodeImpl, 'If');
