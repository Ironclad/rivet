import { nanoid } from 'nanoid';
import { NodeImpl, nodeDefinition } from '../NodeImpl';
export class RaceInputsNodeImpl extends NodeImpl {
    static create() {
        const chartNode = {
            type: 'raceInputs',
            title: 'Race Inputs',
            id: nanoid(),
            visualData: {
                x: 0,
                y: 0,
                width: 300,
            },
            data: {},
        };
        return chartNode;
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
                id: 'result',
                title: 'Result',
                dataType: 'any',
            },
        ];
    }
    getEditors() {
        return [];
    }
    async process(inputs, context) {
        // GraphProcessor handles most of the racing/aborting logic for us.
        const value = Object.entries(inputs).find(([key, value]) => key.startsWith('input') && value !== undefined);
        if (!value) {
            return {
                ['result']: {
                    type: 'control-flow-excluded',
                    value: undefined,
                },
            };
        }
        return {
            ['result']: value[1],
        };
    }
}
export const raceInputsNode = nodeDefinition(RaceInputsNodeImpl, 'Race Inputs');
