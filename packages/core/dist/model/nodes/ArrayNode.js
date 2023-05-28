import { nanoid } from 'nanoid';
import { NodeImpl } from '../NodeImpl';
import { entries } from '../../utils/typeSafety';
export class ArrayNodeImpl extends NodeImpl {
    static create() {
        const chartNode = {
            type: 'array',
            title: 'Array',
            id: nanoid(),
            visualData: {
                x: 0,
                y: 0,
                width: 200,
            },
            data: {},
        };
        return chartNode;
    }
    getInputDefinitions(connections) {
        const inputs = [];
        const inputCount = this.#getInputPortCount(connections);
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
                dataType: 'any[]',
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
            const inputNumber = parseInt(connection.inputId.replace('input', ''));
            if (inputNumber > maxInputNumber) {
                maxInputNumber = inputNumber;
            }
        }
        return maxInputNumber + 1;
    }
    async process(inputs) {
        const outputArray = [];
        for (const [key, input] of entries(inputs)) {
            if (key.startsWith('input')) {
                outputArray.push(input?.value);
            }
        }
        return {
            ['output']: {
                type: 'any[]',
                value: outputArray,
            },
        };
    }
}
