import { NodeImpl, nodeDefinition } from '../NodeImpl';
import { nanoid } from 'nanoid';
import { coerceTypeOptional, getIntegration } from '../..';
import dedent from 'ts-dedent';
export class VectorStoreNodeImpl extends NodeImpl {
    static create() {
        return {
            id: nanoid(),
            type: 'vectorStore',
            title: 'Vector Store',
            visualData: { x: 0, y: 0, width: 200 },
            data: {
                integration: 'pinecone',
                collectionId: '',
            },
        };
    }
    getInputDefinitions() {
        const inputDefinitions = [];
        inputDefinitions.push({
            id: 'vector',
            title: 'Vector',
            dataType: 'vector',
            required: true,
        });
        if (this.data.useCollectionIdInput) {
            inputDefinitions.push({
                id: 'collectionId',
                title: 'Collection ID',
                dataType: 'string',
                required: true,
            });
        }
        inputDefinitions.push({
            id: 'data',
            title: 'Data',
            dataType: 'any',
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
        inputDefinitions.push({
            id: 'id',
            title: 'ID',
            dataType: 'string',
            required: false,
        });
        return inputDefinitions;
    }
    getOutputDefinitions() {
        const outputs = [
            {
                id: 'complete',
                title: 'Complete',
                dataType: 'boolean',
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
                options: [
                    { label: 'Pinecone', value: 'pinecone' },
                    { label: 'Milvus', value: 'milvus' },
                ],
                useInputToggleDataKey: 'useIntegrationInput',
            },
            {
                type: 'string',
                label: 'Collection ID',
                dataKey: 'collectionId',
                useInputToggleDataKey: 'useCollectionIdInput',
            },
        ];
    }
    getBody() {
        return dedent `
      ${this.data.useIntegrationInput ? '(Integration using input)' : this.data.integration}
      ${this.data.useCollectionIdInput ? '(using input)' : this.data.collectionId}
    `;
    }
    async process(inputs, context) {
        const integration = this.data.useIntegrationInput
            ? coerceTypeOptional(inputs['integration'], 'string') ?? this.data.integration
            : this.data.integration;
        const vectorDb = getIntegration('vectorDatabase', integration, context);
        if (inputs['vector']?.type !== 'vector') {
            throw new Error(`Expected vector input, got ${inputs['vector']?.type}`);
        }
        await vectorDb.store({ type: 'string', value: this.data.collectionId }, inputs['vector'], inputs['data'], {
            id: coerceTypeOptional(inputs['id'], 'string'),
        });
        return {
            ['complete']: {
                type: 'boolean',
                value: true,
            },
        };
    }
}
export const vectorStoreNode = nodeDefinition(VectorStoreNodeImpl, 'Vector Store');
