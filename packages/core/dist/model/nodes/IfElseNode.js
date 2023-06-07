import { NodeImpl, nodeDefinition } from '../NodeImpl';
import { nanoid } from 'nanoid';
import { ControlFlowExcludedPort } from '../../utils/symbols';
class IfElseNodeImpl extends NodeImpl {
    static create = () => {
        const chartNode = {
            type: 'ifElse',
            title: 'If/Else',
            id: nanoid(),
            data: {},
            visualData: {
                x: 0,
                y: 0,
                width: 125,
            },
        };
        return chartNode;
    };
    getInputDefinitions() {
        return [
            {
                id: 'if',
                title: 'If',
                dataType: 'any',
            },
            {
                id: 'true',
                title: 'True',
                dataType: 'any',
            },
            {
                id: 'false',
                title: 'False',
                dataType: 'any',
            },
        ];
    }
    getOutputDefinitions() {
        return [
            {
                id: 'output',
                title: 'Output',
                dataType: 'any',
            },
        ];
    }
    async process(inputData) {
        const ifValue = inputData['if'];
        const trueValue = inputData['true'] ?? { type: 'any', value: undefined };
        const falseValue = inputData['false'] ?? { type: 'any', value: undefined };
        if (!(trueValue || falseValue)) {
            return {
                ['output']: {
                    type: 'control-flow-excluded',
                    value: undefined,
                },
            };
        }
        if (ifValue?.type === 'control-flow-excluded') {
            return {
                ['output']: falseValue,
            };
        }
        if (inputData[ControlFlowExcludedPort]) {
            return {
                ['output']: falseValue,
            };
        }
        if (ifValue?.type && ifValue.type === 'boolean') {
            return {
                ['output']: ifValue.value ? trueValue : falseValue,
            };
        }
        if (ifValue?.type === 'string') {
            return {
                ['output']: ifValue.value.length > 0 ? trueValue : falseValue,
            };
        }
        if (ifValue?.type === 'chat-message') {
            return {
                ['output']: ifValue.value.message.length > 0 ? trueValue : falseValue,
            };
        }
        if (ifValue?.type.endsWith('[]')) {
            return {
                ['output']: ifValue.value.length > 0 ? trueValue : falseValue,
            };
        }
        if (ifValue?.type === 'any' || ifValue?.type === 'object') {
            return {
                ['output']: !!ifValue.value ? trueValue : falseValue,
            };
        }
        return {
            ['output']: falseValue,
        };
    }
}
export { IfElseNodeImpl };
export const ifElseNode = nodeDefinition(IfElseNodeImpl, 'If/Else');
