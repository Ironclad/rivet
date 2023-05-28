import { NodeImpl } from '../NodeImpl';
import { nanoid } from 'nanoid';
class PassthroughNodeImpl extends NodeImpl {
    static create = () => {
        const chartNode = {
            type: 'passthrough',
            title: 'Passthrough',
            id: nanoid(),
            data: {},
            visualData: {
                x: 0,
                y: 0,
                width: 175,
            },
        };
        return chartNode;
    };
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
    getOutputDefinitions(connections) {
        const outputs = [];
        const inputCount = this.#getInputPortCount(connections);
        for (let i = 1; i <= inputCount - 1; i++) {
            outputs.push({
                dataType: 'any',
                id: `output${i}`,
                title: `Output ${i}`,
            });
        }
        return outputs;
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
        const inputCount = Object.keys(inputData).filter((key) => key.startsWith('input')).length;
        const outputs = {};
        for (let i = 1; i <= inputCount; i++) {
            const input = inputData[`input${i}`];
            outputs[`output${i}`] = input;
        }
        return outputs;
    }
}
export { PassthroughNodeImpl };
