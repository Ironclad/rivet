import { NodeImpl } from '../../model/NodeImpl';
import { getTokenCountForMessages, modelToTiktokenModel } from '../../utils/tokenizer';
import { nanoid } from 'nanoid';
import { expectType } from '../..';
export class TrimChatMessagesNodeImpl extends NodeImpl {
    static create() {
        const chartNode = {
            type: 'trimChatMessages',
            title: 'Trim Chat Messages',
            id: nanoid(),
            visualData: {
                x: 0,
                y: 0,
                width: 200,
            },
            data: {
                maxTokenCount: 4096,
                removeFromBeginning: true,
                model: 'gpt-3.5-turbo',
            },
        };
        return chartNode;
    }
    getInputDefinitions() {
        return [
            {
                id: 'input',
                title: 'Input',
                dataType: 'chat-message[]',
            },
        ];
    }
    getOutputDefinitions() {
        return [
            {
                id: 'trimmed',
                title: 'Trimmed',
                dataType: 'chat-message[]',
            },
        ];
    }
    async process(inputs) {
        const input = expectType(inputs['input'], 'chat-message[]');
        const maxTokenCount = this.chartNode.data.maxTokenCount;
        const removeFromBeginning = this.chartNode.data.removeFromBeginning;
        const model = 'gpt-3.5-turbo'; // You can change this to a configurable model if needed
        const tiktokenModel = modelToTiktokenModel[model];
        let trimmedMessages = [...input];
        let tokenCount = getTokenCountForMessages(trimmedMessages.map((message) => ({ content: message.message, role: message.type })), tiktokenModel);
        while (tokenCount > maxTokenCount) {
            if (removeFromBeginning) {
                trimmedMessages.shift();
            }
            else {
                trimmedMessages.pop();
            }
            tokenCount = getTokenCountForMessages(trimmedMessages.map((message) => ({ content: message.message, role: message.type })), tiktokenModel);
        }
        return {
            ['trimmed']: {
                type: 'chat-message[]',
                value: trimmedMessages,
            },
        };
    }
}
