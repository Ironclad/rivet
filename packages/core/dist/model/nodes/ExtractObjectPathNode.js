import { nanoid } from 'nanoid';
import { NodeImpl, nodeDefinition } from '../NodeImpl';
import { JSONPath } from 'jsonpath-plus';
import { expectType } from '../../utils/expectType';
import { coerceTypeOptional } from '../..';
export class ExtractObjectPathNodeImpl extends NodeImpl {
    static create() {
        const chartNode = {
            type: 'extractObjectPath',
            title: 'Extract Object Path',
            id: nanoid(),
            visualData: {
                x: 0,
                y: 0,
                width: 250,
            },
            data: {
                path: '$',
                usePathInput: false,
            },
        };
        return chartNode;
    }
    getInputDefinitions() {
        const inputDefinitions = [
            {
                id: 'object',
                title: 'Object',
                dataType: 'object',
                required: true,
            },
        ];
        if (this.chartNode.data.usePathInput) {
            inputDefinitions.push({
                id: 'path',
                title: 'Path',
                dataType: 'string',
                required: true,
            });
        }
        return inputDefinitions;
    }
    getOutputDefinitions() {
        return [
            {
                id: 'match',
                title: 'Match',
                dataType: 'any',
            },
            {
                id: 'all_matches',
                title: 'All Matches',
                dataType: 'any[]',
            },
        ];
    }
    getEditors() {
        return [
            {
                type: 'code',
                label: 'Path',
                dataKey: 'path',
                language: 'jsonpath',
                useInputToggleDataKey: 'usePathInput',
            },
        ];
    }
    async process(inputs) {
        const inputObject = coerceTypeOptional(inputs['object'], 'object');
        const inputPath = this.chartNode.data.usePathInput
            ? expectType(inputs['path'], 'string')
            : this.chartNode.data.path;
        if (!inputPath) {
            throw new Error('Path input is not provided');
        }
        let matches;
        try {
            matches = JSONPath({ json: inputObject ?? null, path: inputPath.trim() });
        }
        catch (err) {
            matches = [];
        }
        if (matches.length === 0) {
            return {
                ['match']: {
                    type: 'control-flow-excluded',
                    value: undefined,
                },
                ['all_matches']: {
                    type: 'any[]',
                    value: [],
                },
            };
        }
        return {
            ['match']: {
                type: 'any',
                value: matches[0],
            },
            ['all_matches']: {
                type: 'any[]',
                value: matches,
            },
        };
    }
}
export const extractObjectPathNode = nodeDefinition(ExtractObjectPathNodeImpl, 'Extract Object Path');
