import { NodeImpl, nodeDefinition } from '../NodeImpl';
import { nanoid } from 'nanoid';
import { coerceType } from '../../utils/coerceType';
import { getError } from '../../utils/errors';
export class ExternalCallNodeImpl extends NodeImpl {
    static create() {
        return {
            id: nanoid(),
            type: 'externalCall',
            title: 'External Call',
            visualData: { x: 0, y: 0, width: 150 },
            data: {
                functionName: '',
                useFunctionNameInput: false,
                useErrorOutput: false,
            },
        };
    }
    getInputDefinitions() {
        const inputDefinitions = [];
        if (this.chartNode.data.useFunctionNameInput) {
            inputDefinitions.push({
                id: 'functionName',
                title: 'Function Name',
                dataType: 'string',
            });
        }
        inputDefinitions.push({
            id: 'arguments',
            title: 'Arguments',
            dataType: 'any[]',
        });
        return inputDefinitions;
    }
    getOutputDefinitions() {
        const outputs = [
            {
                id: 'result',
                title: 'Result',
                dataType: 'any',
            },
        ];
        if (this.chartNode.data.useErrorOutput) {
            outputs.push({
                id: 'error',
                title: 'Error',
                dataType: 'string',
            });
        }
        return outputs;
    }
    getEditors() {
        return [
            {
                type: 'string',
                label: 'Function Name',
                dataKey: 'functionName',
                useInputToggleDataKey: 'useFunctionNameInput',
            },
            {
                type: 'toggle',
                label: 'Use Error Output',
                dataKey: 'useErrorOutput',
            },
        ];
    }
    async process(inputs, context) {
        const functionName = this.chartNode.data.useFunctionNameInput
            ? coerceType(inputs['functionName'], 'string')
            : this.chartNode.data.functionName;
        let args = inputs['arguments'];
        let arrayArgs = {
            type: 'any[]',
            value: [],
        };
        if (args) {
            if (args.type.endsWith('[]') === false) {
                arrayArgs = {
                    type: 'any[]',
                    value: [args.value],
                };
            }
            else {
                arrayArgs = args;
            }
        }
        const fn = context.externalFunctions[functionName];
        if (!fn) {
            throw new Error(`Function ${functionName} not was not defined using setExternalCall`);
        }
        if (this.data.useErrorOutput) {
            try {
                const result = await fn(...arrayArgs.value);
                return {
                    ['result']: result,
                    ['error']: {
                        type: 'control-flow-excluded',
                        value: undefined,
                    },
                };
            }
            catch (error) {
                return {
                    ['result']: {
                        type: 'control-flow-excluded',
                        value: undefined,
                    },
                    ['error']: {
                        type: 'string',
                        value: getError(error).message,
                    },
                };
            }
        }
        const result = await fn(...arrayArgs.value);
        return {
            ['result']: result,
        };
    }
}
export const externalCallNode = nodeDefinition(ExternalCallNodeImpl, 'External Call');
