import { nanoid } from 'nanoid';
import { NodeImpl, nodeDefinition } from '../NodeImpl';
export class ToolNodeImpl extends NodeImpl {
    static create() {
        const chartNode = {
            type: 'tool',
            title: 'Tool',
            id: nanoid(),
            visualData: {
                x: 0,
                y: 0,
                width: 250,
            },
            data: {
                name: 'newTool',
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
                id: 'tool',
                title: 'Tool',
                dataType: 'gpt-tool',
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
                type: 'string',
                label: 'Namespace',
                dataKey: 'namespace',
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
            ['tool']: {
                type: 'gpt-tool',
                value: {
                    name: this.data.name,
                    description: this.data.description,
                    namespace: this.data.namespace,
                    schema: parsedSchema,
                },
            },
        };
    }
}
export const toolNode = nodeDefinition(ToolNodeImpl, 'Tool');
