import { nanoid } from 'nanoid';
import { NodeImpl, nodeDefinition } from '../NodeImpl';
// @ts-ignore
import yaml from 'yaml';
import { coerceType } from '../..';
export class ToYamlNodeImpl extends NodeImpl {
    static create() {
        const chartNode = {
            type: 'toYaml',
            title: 'To YAML',
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
                id: 'object',
                title: 'Object',
                dataType: 'object',
                required: true,
            },
        ];
    }
    getOutputDefinitions() {
        return [
            {
                id: 'yaml',
                title: 'YAML',
                dataType: 'string',
            },
        ];
    }
    async process(inputs) {
        const object = coerceType(inputs['object'], 'object');
        const toYaml = yaml.stringify(object, null, {
            indent: 2,
        });
        return {
            ['yaml']: {
                type: 'string',
                value: toYaml,
            },
        };
    }
}
export const toYamlNode = nodeDefinition(ToYamlNodeImpl, 'To YAML');
