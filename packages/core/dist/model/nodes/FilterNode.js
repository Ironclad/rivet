import { nanoid } from 'nanoid';
import { NodeImpl, nodeDefinition } from '../NodeImpl';
import { coerceType } from '../..';
import { zip } from 'lodash-es';
export class FilterNodeImpl extends NodeImpl {
    static create() {
        const chartNode = {
            type: 'filter',
            title: 'Filter',
            id: nanoid(),
            visualData: {
                x: 0,
                y: 0,
                width: 175,
            },
            data: {},
        };
        return chartNode;
    }
    getInputDefinitions() {
        return [
            {
                id: 'array',
                title: 'Array',
                dataType: 'any[]',
                required: true,
            },
            {
                id: 'include',
                title: 'Include',
                dataType: 'boolean[]',
                required: true,
            },
        ];
    }
    getOutputDefinitions() {
        return [
            {
                id: 'filtered',
                title: 'Filtered',
                dataType: 'any[]',
            },
        ];
    }
    async process(inputs) {
        const array = coerceType(inputs['array'], 'any[]');
        const include = coerceType(inputs['include'], 'boolean[]');
        const zipped = zip(array, include);
        const filtered = zipped.filter(([_, include]) => include).map(([value, _]) => value);
        return {
            ['filtered']: {
                type: inputs['array']?.type ?? 'any',
                value: filtered,
            },
        };
    }
}
export const filterNode = nodeDefinition(FilterNodeImpl, 'Filter');
