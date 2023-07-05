import { nanoid } from 'nanoid';
import { NodeImpl, nodeDefinition } from '../NodeImpl';
import { coerceType } from '../../utils/coerceType';
export class LoopControllerNodeImpl extends NodeImpl {
    static create() {
        const chartNode = {
            type: 'loopController',
            title: 'Loop Controller',
            id: nanoid(),
            visualData: {
                x: 0,
                y: 0,
                width: 250,
            },
            data: {
                maxIterations: 100,
            },
        };
        return chartNode;
    }
    getInputDefinitions(connections, nodes) {
        const inputs = [];
        const messageCount = this.#getInputPortCount(connections);
        inputs.push({
            dataType: 'any',
            id: 'continue',
            title: 'Continue',
        });
        let i = 1;
        for (; i <= messageCount + 1; i++) {
            const input = {
                dataType: 'any',
                id: `input${i}`,
                title: `Input ${i}`,
            };
            const inputConnection = connections.find((connection) => connection.inputId === input.id);
            if (inputConnection && nodes[inputConnection.outputNodeId]) {
                input.title = nodes[inputConnection.outputNodeId].title;
            }
            const inputDefault = {
                dataType: 'any',
                id: `input${i}Default`,
                title: `Input ${i} Default`,
            };
            const inputDefaultConnection = connections.find((connection) => connection.inputId === inputDefault.id);
            if (inputDefaultConnection && nodes[inputDefaultConnection.outputNodeId]) {
                inputDefault.title = nodes[inputDefaultConnection.outputNodeId].title;
            }
            inputs.push(input);
            inputs.push(inputDefault);
        }
        return inputs;
    }
    getOutputDefinitions(connections, nodes) {
        const messageCount = this.#getInputPortCount(connections);
        const outputs = [];
        outputs.push({
            dataType: 'any',
            id: 'break',
            title: 'Break',
        });
        for (let i = 1; i <= messageCount; i++) {
            const output = {
                dataType: 'any',
                id: `output${i}`,
                title: `Output ${i}`,
            };
            const inputConnection = connections.find((connection) => connection.inputId === `input${i}`);
            if (inputConnection && nodes[inputConnection.outputNodeId]) {
                output.title = `${nodes[inputConnection.outputNodeId].title}?`;
            }
            outputs.push(output);
        }
        return outputs;
    }
    getEditors() {
        return [
            {
                type: 'number',
                label: 'Max Iterations',
                dataKey: 'maxIterations',
            },
        ];
    }
    #getInputPortCount(connections) {
        const inputNodeId = this.chartNode.id;
        const messageConnections = connections.filter((connection) => connection.inputNodeId === inputNodeId && connection.inputId.startsWith('input'));
        let maxMessageNumber = 0;
        for (const connection of messageConnections) {
            const messageNumber = parseInt(connection.inputId.replace('input', ''));
            if (messageNumber > maxMessageNumber) {
                maxMessageNumber = messageNumber;
            }
        }
        return maxMessageNumber;
    }
    async process(inputs, context) {
        const output = {};
        // If the continue port is not connected (so undefined), or if it's undefined before it's
        // inside the loop itself (connection has not ran yet), then we should continue by default.
        let continueValue = false;
        if (inputs['continue'] === undefined) {
            continueValue = true;
        }
        else {
            let continueDataValue = inputs['continue'];
            if (continueDataValue.type === 'control-flow-excluded') {
                continueValue = false;
            }
            else {
                continueValue = coerceType(continueDataValue, 'boolean');
            }
        }
        const inputCount = Object.keys(inputs).filter((key) => key.startsWith('input') && !key.endsWith('Default')).length;
        if (continueValue) {
            output['break'] = { type: 'control-flow-excluded', value: 'loop-not-broken' };
        }
        else {
            let inputValues = [];
            for (let i = 1; i <= inputCount; i++) {
                inputValues.push(inputs[`input${i}`]?.value);
            }
            // Break gets an array of all the input values
            output['break'] = { type: 'any[]', value: inputValues };
        }
        for (let i = 1; i <= inputCount; i++) {
            if (continueValue) {
                const inputId = `input${i}`;
                const outputId = `output${i}`;
                if (inputs[inputId]) {
                    output[outputId] = inputs[inputId];
                }
                else {
                    output[outputId] = inputs[`${inputId}Default`];
                }
            }
            else {
                output[`output${i}`] = { type: 'control-flow-excluded', value: undefined };
            }
        }
        return output;
    }
}
export const loopControllerNode = nodeDefinition(LoopControllerNodeImpl, 'Loop Controller');
