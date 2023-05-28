import { nanoid } from 'nanoid';
import { NodeImpl } from '../NodeImpl';
import { expectType, expectTypeOptional } from '../../utils/expectType';
export class ExtractRegexNodeImpl extends NodeImpl {
    static create(regex = '([a-zA-Z]+)') {
        const chartNode = {
            type: 'extractRegex',
            title: 'Extract Regex',
            id: nanoid(),
            visualData: {
                x: 0,
                y: 0,
                width: 250,
            },
            data: {
                regex,
                useRegexInput: false,
                errorOnFailed: false,
            },
        };
        return chartNode;
    }
    getInputDefinitions() {
        const inputs = [
            {
                id: 'input',
                title: 'Input',
                dataType: 'string',
                required: true,
            },
        ];
        if (this.chartNode.data.useRegexInput) {
            inputs.push({
                id: 'regex',
                title: 'Regex',
                dataType: 'string',
                required: false,
            });
        }
        return inputs;
    }
    getOutputDefinitions() {
        const regex = this.chartNode.data.regex;
        try {
            const regExp = new RegExp(regex, 'g');
            const captureGroupCount = countCaptureGroups(regExp);
            const outputs = [];
            for (let i = 0; i < captureGroupCount; i++) {
                outputs.push({
                    id: `output${i + 1}`,
                    title: `Output ${i + 1}`,
                    dataType: 'string',
                });
            }
            outputs.push({
                id: 'matches',
                title: 'Matches',
                dataType: 'string[]',
            });
            outputs.push({
                id: 'succeeded',
                title: 'Succeeded',
                dataType: 'boolean',
            }, {
                id: 'failed',
                title: 'Failed',
                dataType: 'boolean',
            });
            return outputs;
        }
        catch (err) {
            return [];
        }
    }
    async process(inputs) {
        const inputString = expectType(inputs['input'], 'string');
        const regex = expectTypeOptional(inputs['regex'], 'string') ?? this.chartNode.data.regex;
        const regExp = new RegExp(regex, 'g');
        let matches = [];
        let match;
        let firstMatch;
        while ((match = regExp.exec(inputString)) !== null) {
            if (!firstMatch) {
                firstMatch = match;
            }
            matches.push(match[1]);
        }
        matches = matches.filter((m) => m);
        if (matches.length === 0 && this.chartNode.data.errorOnFailed) {
            throw new Error(`No match found for regex ${regex}`);
        }
        const outputArray = {
            type: 'string[]',
            value: matches,
        };
        if (!firstMatch) {
            if (this.chartNode.data.errorOnFailed) {
                throw new Error(`No match found for regex ${regex}`);
            }
            return {
                ['succeeded']: {
                    type: 'boolean',
                    value: false,
                },
                ['failed']: {
                    type: 'boolean',
                    value: true,
                },
            };
        }
        const output = {
            ['succeeded']: {
                type: 'boolean',
                value: true,
            },
            ['failed']: {
                type: 'boolean',
                value: false,
            },
        };
        output['matches'] = outputArray;
        for (let i = 1; i < firstMatch.length; i++) {
            output[`output${i}`] = {
                type: 'string',
                value: firstMatch[i],
            };
        }
        return output;
    }
}
function countCaptureGroups(regex) {
    const regexSource = regex.source;
    let count = 0;
    let inCharacterClass = false;
    for (let i = 0; i < regexSource.length; i++) {
        const currentChar = regexSource[i];
        const prevChar = i > 0 ? regexSource[i - 1] : null;
        if (currentChar === '[' && prevChar !== '\\') {
            inCharacterClass = true;
        }
        else if (currentChar === ']' && prevChar !== '\\') {
            inCharacterClass = false;
        }
        else if (currentChar === '(' && prevChar !== '\\' && !inCharacterClass) {
            if (regexSource[i + 1] !== '?' || regexSource[i + 2] === ':') {
                count++;
            }
        }
    }
    return count;
}
