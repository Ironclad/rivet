import { NodeImpl, nodeDefinition } from '../NodeImpl';
import { nanoid } from 'nanoid';
import { getIntegration } from '../..';
import dedent from 'ts-dedent';
export class VectorNearestNeighborsNodeImpl extends NodeImpl {
    static create() {
        return {
            id: nanoid(),
            type: 'vectorNearestNeighbors',
            title: 'Vector KNN',
            visualData: { x: 0, y: 0, width: 200 },
            data: {
                k: 10,
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
        if (this.data.useKInput) {
            inputDefinitions.push({
                id: 'k',
                title: 'K',
                dataType: 'number',
                required: true,
            });
        }
        if (this.data.useCollectionIdInput) {
            inputDefinitions.push({
                id: 'collectionId',
                title: 'Collection ID',
                dataType: 'string',
                required: true,
            });
        }
        return inputDefinitions;
    }
    getOutputDefinitions() {
        const outputs = [
            {
                id: 'results',
                title: 'Results',
                dataType: 'any[]',
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
                type: 'number',
                label: 'K',
                dataKey: 'k',
                min: 1,
                max: 100,
                step: 1,
                defaultValue: 10,
                useInputToggleDataKey: 'useKInput',
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
      k: ${this.data.useKInput ? '(using input)' : this.data.k}
      ${this.data.useCollectionIdInput ? '(using input)' : this.data.collectionId}
    `;
    }
    async process(inputs, context) {
        const vectorDb = getIntegration('vectorDatabase', this.data.integration, context);
        if (inputs['vector']?.type !== 'vector') {
            throw new Error(`Expected vector input, got ${inputs['vector']?.type}`);
        }
        console.dir({ collectionId: this.data.collectionId });
        const results = await vectorDb.nearestNeighbors({ type: 'string', value: this.data.collectionId }, inputs['vector'], this.data.k);
        return {
            ['results']: results,
        };
    }
}
export const vectorNearestNeighborsNode = nodeDefinition(VectorNearestNeighborsNodeImpl, 'Vector KNN');
