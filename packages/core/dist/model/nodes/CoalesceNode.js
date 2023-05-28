import { NodeImpl } from '../NodeImpl';
import { nanoid } from 'nanoid';
import { coerceType } from '../../utils/coerceType';
class CoalesceNodeImpl extends NodeImpl {
    static create = () => {
        const chartNode = {
            type: 'coalesce',
            title: 'Coalesce',
            id: nanoid(),
            data: {},
            visualData: {
                x: 0,
                y: 0,
                width: 150,
            },
        };
        return chartNode;
    };
    getInputDefinitions(connections) {
        const inputs = [];
        const inputCount = this.#getInputPortCount(connections);
        inputs.push({
            dataType: 'boolean',
            id: 'conditional',
            title: 'Conditional',
        });
        for (let i = 1; i <= inputCount; i++) {
            inputs.push({
                dataType: 'any',
                id: `input${i}`,
                title: `Input ${i}`,
            });
        }
        return inputs;
    }
    getOutputDefinitions() {
        return [
            {
                dataType: 'any',
                id: 'output',
                title: 'Output',
            },
        ];
    }
    #getInputPortCount(connections) {
        const inputNodeId = this.chartNode.id;
        const inputConnections = connections.filter((connection) => connection.inputNodeId === inputNodeId && connection.inputId.startsWith('input'));
        let maxInputNumber = 0;
        for (const connection of inputConnections) {
            const messageNumber = parseInt(connection.inputId.replace('input', ''), 10);
            if (messageNumber > maxInputNumber) {
                maxInputNumber = messageNumber;
            }
        }
        return maxInputNumber + 1;
    }
    async process(inputData) {
        const conditional = inputData['conditional'];
        // This lets the coalesce actually be control-flow-excluded itself, because otherwise
        // the input control-flow-excluded are consumed.
        if (conditional?.type === 'control-flow-excluded') {
            return {
                ['output']: {
                    type: 'control-flow-excluded',
                    value: undefined,
                },
            };
        }
        const inputCount = Object.keys(inputData).filter((key) => key.startsWith('input')).length;
        const okInputValues = [];
        for (let i = 1; i <= inputCount; i++) {
            const inputValue = inputData[`input${i}`];
            if (inputValue && inputValue.type !== 'control-flow-excluded' && coerceType(inputValue, 'boolean')) {
                okInputValues.push(inputValue);
            }
        }
        if (okInputValues.length === 0) {
            return {
                ['output']: {
                    type: 'control-flow-excluded',
                    value: undefined,
                },
            };
        }
        return {
            ['output']: okInputValues[0],
        };
    }
}
export { CoalesceNodeImpl };
