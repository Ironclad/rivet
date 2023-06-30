import { nanoid } from 'nanoid';
import { NodeImpl, nodeDefinition } from '../NodeImpl';
import { coerceType } from '../..';
export class ToJsonNodeImpl extends NodeImpl {
    static create() {
        const chartNode = {
            type: 'toJson',
            title: 'To JSON',
            id: nanoid(),
            visualData: {
                x: 0,
                y: 0,
                width: 175,
            },
            data: {
                indented: true,
            },
        };
        return chartNode;
    }
    getInputDefinitions() {
        return [
            {
                id: 'data',
                title: 'Data',
                dataType: 'any',
                required: true,
            },
        ];
    }
    getOutputDefinitions() {
        return [
            {
                id: 'json',
                title: 'JSON',
                dataType: 'string',
            },
        ];
    }
    getEditors() {
        return [
            {
                type: 'toggle',
                label: 'Indented',
                dataKey: 'indented',
            },
        ];
    }
    getBody() {
        return this.data.indented ? 'Indented' : 'Not indented';
    }
    async process(inputs) {
        const data = coerceType(inputs['data'], 'any');
        const toJson = this.data.indented ? JSON.stringify(data, null, 2) : JSON.stringify(data);
        return {
            ['json']: {
                type: 'string',
                value: toJson,
            },
        };
    }
}
export const toJsonNode = nodeDefinition(ToJsonNodeImpl, 'To JSON');
