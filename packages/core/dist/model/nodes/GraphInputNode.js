import { nanoid } from 'nanoid';
import { NodeImpl } from '../NodeImpl';
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
    async process() {
        // This node does not process any data, it just provides the input value
        return {};
    }
    async getOutputValuesFromGraphInput(graphInputs, nodeInputs) {
        let inputValue = graphInputs[this.data.id];
        if (inputValue == null) {
            if (this.data.useDefaultValueInput) {
                inputValue = nodeInputs['default'];
            }
            else {
                inputValue = { type: this.data.dataType, value: this.data.defaultValue };
            }
        }
        // Resolve undefined for array inputs to empty array
        if ((inputValue == null || inputValue.value == null) && this.data.dataType.endsWith('[]')) {
            inputValue = { type: this.data.dataType, value: [] };
        }
        const outputValues = { ['data']: inputValue };
        return outputValues;
    }
}
