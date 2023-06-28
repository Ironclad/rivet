import { nanoid } from 'nanoid';
import { NodeImpl, nodeDefinition } from '../NodeImpl';
export class ContextNodeImpl extends NodeImpl {
    static create(id = 'input', dataType = 'string') {
        const chartNode = {
            type: 'context',
            title: 'Context',
            id: nanoid(),
            visualData: {
                x: 0,
                y: 0,
                width: 300,
            },
            data: {
                id,
                dataType,
                defaultValue: undefined,
                useDefaultValueInput: false,
            },
        };
        return chartNode;
    }
    getInputDefinitions() {
        if (this.data.useDefaultValueInput) {
            return [
                {
                    id: 'default',
                    title: 'Default Value',
                    dataType: this.chartNode.data.dataType,
                },
            ];
        }
        return [];
    }
    getOutputDefinitions() {
        return [
            {
                id: 'data',
                title: this.data.id,
                dataType: this.chartNode.data.dataType,
            },
        ];
    }
    getEditors() {
        return [
            { type: 'string', label: 'ID', dataKey: 'id' },
            { type: 'dataTypeSelector', label: 'Data Type', dataKey: 'dataType' },
            {
                type: 'anyData',
                label: 'Default Value',
                dataKey: 'defaultValue',
                useInputToggleDataKey: 'useDefaultValueInput',
            },
        ];
    }
    async process(inputs, context) {
        const contextValue = context.contextValues[this.data.id];
        if (contextValue !== undefined) {
            return {
                ['data']: contextValue,
            };
        }
        let defaultValue;
        if (this.data.useDefaultValueInput) {
            defaultValue = inputs['default'];
        }
        else {
            defaultValue = { type: this.data.dataType, value: this.data.defaultValue };
        }
        return {
            ['data']: defaultValue,
        };
    }
}
export const contextNode = nodeDefinition(ContextNodeImpl, 'Context');
