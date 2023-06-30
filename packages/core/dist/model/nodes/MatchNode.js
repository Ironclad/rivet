import { nanoid } from 'nanoid';
import { NodeImpl, nodeDefinition } from '../NodeImpl';
import { coerceType } from '../..';
export class MatchNodeImpl extends NodeImpl {
    static create(caseCount = 2, cases = ['YES', 'NO']) {
        const chartNode = {
            type: 'match',
            title: 'Match',
            id: nanoid(),
            visualData: {
                x: 0,
                y: 0,
                width: 300,
            },
            data: {
                caseCount,
                cases,
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
        return inputs;
    }
    getOutputDefinitions() {
        const outputs = [];
        for (let i = 0; i < this.chartNode.data.caseCount; i++) {
            outputs.push({
                id: `case${i + 1}`,
                title: `Case ${i + 1}`,
                dataType: 'string',
            });
        }
        outputs.push({
            id: 'unmatched',
            title: 'Unmatched',
            dataType: 'string',
        });
        return outputs;
    }
    async process(inputs) {
        const inputString = coerceType(inputs.input, 'string');
        const cases = this.chartNode.data.cases;
        let matched = false;
        const output = {};
        console.dir({ inputs });
        for (let i = 0; i < cases.length; i++) {
            const regExp = new RegExp(cases[i]);
            const match = regExp.test(inputString);
            if (match) {
                matched = true;
                output[`case${i + 1}`] = {
                    type: 'string',
                    value: inputString,
                };
            }
            else {
                output[`case${i + 1}`] = {
                    type: 'control-flow-excluded',
                    value: undefined,
                };
            }
        }
        if (!matched) {
            output.unmatched = {
                type: 'string',
                value: inputString,
            };
        }
        else {
            output.unmatched = {
                type: 'control-flow-excluded',
                value: undefined,
            };
        }
        return output;
    }
}
export const matchNode = nodeDefinition(MatchNodeImpl, 'Match');
