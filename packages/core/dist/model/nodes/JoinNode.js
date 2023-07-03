import { NodeImpl, nodeDefinition } from '../NodeImpl';
import { isArrayDataValue } from '../DataValue';
import { nanoid } from 'nanoid';
import { coerceType, coerceTypeOptional, inferType } from '../../utils/coerceType';
export class JoinNodeImpl extends NodeImpl {
    static create = () => {
        const chartNode = {
            type: 'join',
            title: 'Join',
            id: nanoid(),
            data: {
                flatten: true,
                joinString: '\n',
            },
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
        if (this.data.useJoinStringInput) {
            inputs.push({
                dataType: 'string',
                id: 'joinString',
                title: 'Join String',
            });
        }
        for (let i = 1; i <= inputCount; i++) {
            inputs.push({
                dataType: 'string',
                id: `input${i}`,
                title: `Input ${i}`,
            });
        }
        return inputs;
    }
    getOutputDefinitions() {
        return [
            {
                dataType: 'string',
                id: 'output',
                title: 'Joined',
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
    getEditors() {
        return [
            {
                type: 'toggle',
                label: 'Flatten',
                dataKey: 'flatten',
            },
            {
                type: 'code',
                label: 'Join String',
                dataKey: 'joinString',
                useInputToggleDataKey: 'useJoinStringInput',
                language: 'plaintext',
            },
        ];
    }
    getBody() {
        return this.data.useJoinStringInput
            ? '(Join value is input)'
            : this.data.joinString === '\n'
                ? '(New line)'
                : this.data.joinString === '\t'
                    ? '(Tab)'
                    : this.data.joinString === ' '
                        ? '(Space)'
                        : this.data.joinString;
    }
    async process(inputs) {
        const joinString = this.data.useJoinStringInput
            ? coerceTypeOptional(inputs['joinString'], 'string') ?? this.data.joinString
            : this.data.joinString;
        const inputKeys = Object.keys(inputs).filter((key) => key.startsWith('input'));
        const inputValueStrings = [];
        for (let i = 1; i <= inputKeys.length; i++) {
            const inputValue = inputs[`input${i}`];
            if (isArrayDataValue(inputValue) && this.data.flatten) {
                for (const value of inputValue.value) {
                    inputValueStrings.push(coerceType(inferType(value), 'string'));
                }
            }
            else if (inputValue) {
                inputValueStrings.push(coerceType(inputValue, 'string'));
            }
        }
        const outputValue = inputValueStrings.join(joinString);
        return {
            ['output']: {
                type: 'string',
                value: outputValue,
            },
        };
    }
}
export const joinNode = nodeDefinition(JoinNodeImpl, 'Coalesce');
