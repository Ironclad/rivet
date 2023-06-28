import { nanoid } from 'nanoid';
import { NodeImpl, nodeDefinition } from '../NodeImpl';
import { isArrayDataType, isScalarDataType, scalarDefaults, unwrapDataValue, } from '../DataValue';
import { coerceType } from '../../utils/coerceType';
export class SetGlobalNodeImpl extends NodeImpl {
    static create() {
        const chartNode = {
            type: 'setGlobal',
            title: 'Set Global',
            id: nanoid(),
            visualData: {
                x: 0,
                y: 0,
                width: 200,
            },
            data: {
                id: 'variable-name',
                dataType: 'string',
                useIdInput: false,
            },
        };
        return chartNode;
    }
    getInputDefinitions() {
        const inputs = [
            {
                id: 'value',
                title: 'Value',
                dataType: this.chartNode.data.dataType,
            },
        ];
        if (this.data.useIdInput) {
            inputs.push({
                id: 'id',
                title: 'Variable ID',
                dataType: 'string',
            });
        }
        return inputs;
    }
    getOutputDefinitions() {
        return [
            {
                id: 'saved-value',
                title: 'Value',
                dataType: this.data.dataType,
            },
            {
                id: 'previous-value',
                title: 'Previous Value',
                dataType: this.data.dataType,
            },
        ];
    }
    async process(inputs, context) {
        const rawValue = inputs['value'];
        if (!rawValue) {
            return {};
        }
        const id = this.data.useIdInput ? coerceType(inputs['id'], 'string') : this.data.id;
        if (!id) {
            throw new Error('Missing variable ID');
        }
        let previousValue = context.getGlobal(this.data.id);
        if (!previousValue && isArrayDataType(this.data.dataType)) {
            previousValue = { type: this.data.dataType, value: [] };
        }
        else if (!previousValue && isScalarDataType(this.data.dataType)) {
            previousValue = { type: this.data.dataType, value: scalarDefaults[this.data.dataType] };
        }
        const value = unwrapDataValue(rawValue);
        context.setGlobal(id, value);
        return {
            ['saved-value']: value,
            ['previous-value']: previousValue,
        };
    }
}
export const setGlobalNode = nodeDefinition(SetGlobalNodeImpl, 'Set Global');
