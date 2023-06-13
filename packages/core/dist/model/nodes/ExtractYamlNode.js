import { nanoid } from 'nanoid';
import { NodeImpl, nodeDefinition } from '../NodeImpl';
// @ts-ignore
import yaml from 'yaml';
import { expectType } from '../../utils/expectType';
import { JSONPath } from 'jsonpath-plus';
export class ExtractYamlNodeImpl extends NodeImpl {
    static create() {
        const chartNode = {
            type: 'extractYaml',
            title: 'Extract YAML',
            id: nanoid(),
            visualData: {
                x: 0,
                y: 0,
                width: 250,
            },
            data: {
                rootPropertyName: 'yamlDocument',
            },
        };
        return chartNode;
    }
    getInputDefinitions() {
        return [
            {
                id: 'input',
                title: 'Input',
                dataType: 'string',
                required: true,
            },
        ];
    }
    getOutputDefinitions() {
        return [
            {
                id: 'output',
                title: 'Output',
                dataType: 'object',
            },
            {
                id: 'matches',
                title: 'Matches',
                dataType: 'any[]',
            },
            {
                id: 'noMatch',
                title: 'No Match',
                dataType: 'string',
            },
        ];
    }
    getEditors() {
        return [
            {
                type: 'string',
                label: 'Root Property Name',
                dataKey: 'rootPropertyName',
            },
            {
                type: 'code',
                label: 'Object Path',
                dataKey: 'objectPath',
                language: 'jsonpath',
            },
        ];
    }
    async process(inputs) {
        const inputString = expectType(inputs['input'], 'string');
        const match = new RegExp(`^${this.data.rootPropertyName}:`, 'm').exec(inputString);
        const rootPropertyStart = match?.index ?? -1;
        const nextLines = inputString.slice(rootPropertyStart).split('\n');
        const yamlLines = [nextLines.shift()]; // remove the first line, which is the root property name
        while (nextLines[0]?.startsWith(' ') || nextLines[0]?.startsWith('\t') || nextLines[0] === '') {
            yamlLines.push(nextLines.shift());
        }
        const potentialYaml = yamlLines.join('\n');
        let yamlObject = undefined;
        try {
            yamlObject = yaml.parse(potentialYaml);
        }
        catch (err) {
            return {
                ['noMatch']: {
                    type: 'string',
                    value: potentialYaml,
                },
                ['output']: {
                    type: 'control-flow-excluded',
                    value: undefined,
                },
            };
        }
        if (!yamlObject?.hasOwnProperty(this.data.rootPropertyName)) {
            return {
                ['noMatch']: {
                    type: 'string',
                    value: potentialYaml,
                },
                ['output']: {
                    type: 'control-flow-excluded',
                    value: undefined,
                },
            };
        }
        let matches = [];
        if (this.data.objectPath) {
            try {
                const extractedValue = JSONPath({ json: yamlObject, path: this.data.objectPath });
                matches = extractedValue;
                yamlObject = extractedValue.length > 0 ? extractedValue[0] : undefined;
            }
            catch (err) {
                return {
                    ['noMatch']: {
                        type: 'string',
                        value: potentialYaml,
                    },
                    ['output']: {
                        type: 'control-flow-excluded',
                        value: undefined,
                    },
                    ['matches']: {
                        type: 'control-flow-excluded',
                        value: undefined,
                    },
                };
            }
        }
        return {
            ['output']: yamlObject === undefined
                ? {
                    type: 'control-flow-excluded',
                    value: undefined,
                }
                : this.data.objectPath
                    ? {
                        type: 'any',
                        value: yamlObject,
                    }
                    : {
                        type: 'object',
                        value: yamlObject,
                    },
            ['noMatch']: {
                type: 'control-flow-excluded',
                value: undefined,
            },
            ['matches']: {
                type: 'any[]',
                value: matches,
            },
        };
    }
}
export const extractYamlNode = nodeDefinition(ExtractYamlNodeImpl, 'Extract YAML');
