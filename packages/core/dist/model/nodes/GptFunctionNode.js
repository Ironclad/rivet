import { nanoid } from 'nanoid';
import { NodeImpl, nodeDefinition } from '../NodeImpl';
export class GptFunctionNodeImpl extends NodeImpl {
    static create() {
        const chartNode = {
            type: 'gptFunction',
            title: 'GPT Function',
            id: nanoid(),
            visualData: {
                x: 0,
                y: 0,
                width: 250,
            },
            data: {
                name: 'newFunction',
                description: 'No description provided',
                schema: `{
  "type": "object",
  "properties": {}
}`,
            },
        };
        return chartNode;
    }
    getInputDefinitions() {
        return [];
    }
    getOutputDefinitions() {
        return [
            {
                id: 'function',
                title: 'Function',
                dataType: 'gpt-function',
            },
        ];
    }
    getEditors() {
        return [
            {
                type: 'string',
                label: 'Name',
                dataKey: 'name',
            },
            {
                type: 'string',
                label: 'Description',
                dataKey: 'description',
            },
            {
                type: 'code',
                label: 'Schema',
                dataKey: 'schema',
                language: 'json',
            },
        ];
    }
    async process(inputs) {
        const parsedSchema = JSON.parse(this.data.schema);
        return {
            ['function']: {
                type: 'gpt-function',
                value: {
                    name: this.data.name,
                    description: this.data.description,
                    parameters: parsedSchema,
                },
            },
        };
    }
}
export const gptFunctionNode = nodeDefinition(GptFunctionNodeImpl, 'GPT Function');
