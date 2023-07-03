import { nanoid } from 'nanoid';
import { NodeImpl, nodeDefinition } from '../NodeImpl';
import { getDefaultValue, isArrayDataType } from '../DataValue';
import { coerceTypeOptional, inferType } from '../..';
export class GraphInputNodeImpl extends NodeImpl {
    static create(id = 'input', dataType = 'string') {
        const chartNode = {
            type: 'graphInput',
            title: 'Graph Input',
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
            {
                type: 'string',
                label: 'ID',
                dataKey: 'id',
            },
            {
                type: 'dataTypeSelector',
                label: 'Data Type',
                dataKey: 'dataType',
            },
            {
                type: 'anyData',
                label: 'Default Value',
                dataKey: 'defaultValue',
                useInputToggleDataKey: 'useDefaultValueInput',
            },
        ];
    }
    async process(inputs, context) {
        let inputValue = context.graphInputs[this.data.id] == null
            ? undefined
            : coerceTypeOptional(context.graphInputs[this.data.id], this.data.dataType);
        if (inputValue == null && this.data.useDefaultValueInput) {
            inputValue = coerceTypeOptional(inputs['default'], this.data.dataType);
        }
        if (inputValue == null) {
            inputValue =
                coerceTypeOptional(inferType(this.data.defaultValue), this.data.dataType) ||
                    getDefaultValue(this.data.dataType);
        }
        // Resolve undefined for array inputs to empty array
        if (inputValue == null && isArrayDataType(this.data.dataType)) {
            inputValue = { type: this.data.dataType, value: [] };
        }
        const value = {
            type: this.data.dataType,
            value: inputValue,
        };
        return { ['data']: value };
    }
}
export const graphInputNode = nodeDefinition(GraphInputNodeImpl, 'Graph Input');
