import { nanoid } from 'nanoid';
import { NodeImpl, nodeDefinition } from '../NodeImpl';
import { isArrayDataType, isScalarDataType, scalarDefaults, } from '../DataValue';
import { coerceType } from '../../utils/coerceType';
export class GetGlobalNodeImpl extends NodeImpl {
    static create(id = 'variable-name') {
        const chartNode = {
            type: 'getGlobal',
            title: 'Get Global',
            id: nanoid(),
            visualData: {
                x: 0,
                y: 0,
                width: 200,
            },
            data: {
                id,
                dataType: 'string',
                onDemand: true,
                useIdInput: false,
                wait: false,
            },
        };
        return chartNode;
    }
    getInputDefinitions() {
        if (this.data.useIdInput) {
            return [
                {
                    id: 'id',
                    title: 'Variable ID',
                    dataType: this.data.dataType,
                },
            ];
        }
        return [];
    }
    getOutputDefinitions() {
        const { onDemand, dataType } = this.chartNode.data;
        return [
            {
                id: 'value',
                title: 'Value',
                dataType: onDemand ? `fn<${dataType}>` : dataType,
            },
        ];
    }
    getEditors() {
        return [
            {
                type: 'string',
                label: 'Variable ID',
                dataKey: 'id',
                useInputToggleDataKey: 'useIdInput',
            },
            {
                type: 'dataTypeSelector',
                label: 'Data Type',
                dataKey: 'dataType',
            },
            {
                type: 'toggle',
                label: 'On Demand',
                dataKey: 'onDemand',
            },
            {
                type: 'toggle',
                label: 'Wait',
                dataKey: 'wait',
            },
        ];
    }
    async process(inputs, context) {
        if (this.data.onDemand) {
            if (this.data.wait) {
                throw new Error('Cannot use onDemand and wait together');
            }
            return {
                ['value']: {
                    type: `fn<${this.data.dataType}>`,
                    value: () => {
                        const id = this.data.useIdInput ? coerceType(inputs['id'], 'string') : this.data.id;
                        const value = context.getGlobal(id);
                        if (value) {
                            return value.value;
                        }
                        // Have some useful defaults before the value is set
                        if (isArrayDataType(this.data.dataType)) {
                            return [];
                        }
                        return scalarDefaults[this.data.dataType];
                    },
                },
            };
        }
        const id = this.data.useIdInput ? coerceType(inputs['id'], 'string') : this.data.id;
        let value = this.data.wait ? await context.waitForGlobal(id) : context.getGlobal(id);
        // Have some useful defaults before the value is set
        if (!value && isArrayDataType(this.data.dataType)) {
            value = { type: this.data.dataType, value: [] };
        }
        if (!value && isScalarDataType(this.data.dataType)) {
            value = { type: this.data.dataType, value: scalarDefaults[this.data.dataType] };
        }
        return {
            ['value']: value,
        };
    }
}
export const getGlobalNode = nodeDefinition(GetGlobalNodeImpl, 'Get Global');
