import { NodeImpl, nodeDefinition } from '../NodeImpl';
import { nanoid } from 'nanoid';
import { coerceType, getIntegration } from '../..';
export class GetEmbeddingNodeImpl extends NodeImpl {
    static create() {
        return {
            id: nanoid(),
            type: 'getEmbedding',
            title: 'Get Embedding',
            visualData: { x: 0, y: 0, width: 200 },
            data: {
                integration: 'openai',
                useIntegrationInput: false,
            },
        };
    }
    getInputDefinitions() {
        const inputDefinitions = [];
        inputDefinitions.push({
            id: 'input',
            title: 'Input',
            dataType: 'string',
            required: true,
        });
        if (this.data.useIntegrationInput) {
            inputDefinitions.push({
                id: 'integration',
                title: 'Integration',
                dataType: 'string',
                required: true,
            });
        }
        return inputDefinitions;
    }
    getOutputDefinitions() {
        const outputs = [
            {
                id: 'embedding',
                title: 'Embedding',
                dataType: 'vector',
            },
        ];
        return outputs;
    }
    getEditors() {
        return [
            {
                type: 'dropdown',
                label: 'Integration',
                dataKey: 'integration',
                options: [{ label: 'OpenAI', value: 'openai' }],
                useInputToggleDataKey: 'useIntegrationInput',
            },
        ];
    }
    getBody() {
        return `Using ${this.data.useIntegrationInput ? '(input)' : this.data.integration}`;
    }
    async process(inputs, context) {
        const input = coerceType(inputs['input'], 'string');
        const integrationName = this.data.useIntegrationInput
            ? coerceType(inputs['integration'], 'string')
            : this.data.integration;
        const embeddingGenerator = getIntegration('embeddingGenerator', integrationName, context);
        const embedding = await embeddingGenerator.generateEmbedding(input);
        return {
            ['embedding']: {
                type: 'vector',
                value: embedding,
            },
        };
    }
}
export const getEmbeddingNode = nodeDefinition(GetEmbeddingNodeImpl, 'Get Embedding');
