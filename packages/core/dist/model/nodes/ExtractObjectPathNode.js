import { nanoid } from 'nanoid';
import { NodeImpl } from '../NodeImpl';
import * as jp from 'jsonpath';
import { expectType } from '../../utils/expectType';
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
    async process(inputs) {
        const inputObject = expectType(inputs['object'], 'object');
        const inputPath = this.chartNode.data.usePathInput
            ? expectType(inputs['path'], 'string')
            : this.chartNode.data.path;
        if (!inputPath) {
            throw new Error('Path input is not provided');
        }
        let matches;
        try {
            matches = jp.query(inputObject, inputPath);
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
