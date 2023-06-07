import { nanoid } from 'nanoid';
import { NodeImpl, nodeDefinition } from '../NodeImpl';
import { ControlFlowExcludedPort } from '../../utils/symbols';
export class GraphOutputNodeImpl extends NodeImpl {
    static create(id = 'output', dataType = 'string') {
        const chartNode = {
            type: 'graphOutput',
            title: 'Graph Output',
            id: nanoid(),
            visualData: {
                x: 0,
                y: 0,
                width: 300,
            },
            data: {
                id,
                dataType,
            },
        };
        return chartNode;
    }
    getInputDefinitions() {
        return [
            {
                id: 'value',
                title: this.data.id,
                dataType: this.chartNode.data.dataType,
            },
        ];
    }
    getOutputDefinitions() {
        return [];
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
        ];
    }
    async process(inputs, context) {
        const value = inputs['value'] ?? { type: 'any', value: undefined };
        const isExcluded = value.type === 'control-flow-excluded' || inputs[ControlFlowExcludedPort] != null;
        if (isExcluded && context.graphOutputs[this.data.id] == null) {
            context.graphOutputs[this.data.id] = {
                type: 'control-flow-excluded',
                value: undefined,
            };
        }
        else if (context.graphOutputs[this.data.id] == null ||
            context.graphOutputs[this.data.id]?.type === 'control-flow-excluded') {
            context.graphOutputs[this.data.id] = value;
        }
        if (isExcluded) {
            return {
                ['value']: {
                    type: 'control-flow-excluded',
                    value: undefined,
                },
            };
        }
        return inputs;
    }
}
export const graphOutputNode = nodeDefinition(GraphOutputNodeImpl, 'Graph Output');
