import { nanoid } from 'nanoid';
import { NodeImpl, nodeDefinition } from '../NodeImpl';
import { arrayizeDataValue, unwrapDataValue, } from '../DataValue';
import { orderBy } from 'lodash-es';
import { coerceType } from '../..';
export class AssemblePromptNodeImpl extends NodeImpl {
    static create() {
        const chartNode = {
            type: 'assemblePrompt',
            title: 'Assemble Prompt',
            id: nanoid(),
            visualData: {
                x: 0,
                y: 0,
                width: 250,
            },
            data: {},
        };
        return chartNode;
    }
    getInputDefinitions(connections) {
        const inputs = [];
        const messageCount = this.#getMessagePortCount(connections);
        for (let i = 1; i <= messageCount; i++) {
            inputs.push({
                dataType: ['chat-message', 'chat-message[]'],
                id: `message${i}`,
                title: `Message ${i}`,
            });
        }
        return inputs;
    }
    getOutputDefinitions() {
        return [
            {
                dataType: 'chat-message[]',
                id: 'prompt',
                title: 'Prompt',
            },
        ];
    }
    #getMessagePortCount(connections) {
        const inputNodeId = this.chartNode.id;
        const messageConnections = connections.filter((connection) => connection.inputNodeId === inputNodeId && connection.inputId.startsWith('message'));
        let maxMessageNumber = 0;
        for (const connection of messageConnections) {
            const messageNumber = parseInt(connection.inputId.replace('message', ''));
            if (messageNumber > maxMessageNumber) {
                maxMessageNumber = messageNumber;
            }
        }
        return maxMessageNumber + 1;
    }
    async process(inputs) {
        const output = {};
        const outMessages = [];
        const inputMessages = orderBy(Object.entries(inputs).filter(([key]) => key.startsWith('message')), ([key]) => key, 'asc');
        for (const [, inputMessage] of inputMessages) {
            if (!inputMessage || inputMessage.type === 'control-flow-excluded' || !inputMessage.value) {
                continue;
            }
            const inMessages = arrayizeDataValue(unwrapDataValue(inputMessage));
            for (const message of inMessages) {
                if (message.type === 'chat-message') {
                    outMessages.push(message.value);
                }
                else {
                    const coerced = coerceType(message, 'string');
                    if (coerced) {
                        outMessages.push({ type: 'user', message: coerced });
                    }
                }
            }
        }
        output['prompt'] = {
            type: 'chat-message[]',
            value: outMessages,
        };
        return output;
    }
}
export const assemblePromptNode = nodeDefinition(AssemblePromptNodeImpl, 'Assemble Prompt');
