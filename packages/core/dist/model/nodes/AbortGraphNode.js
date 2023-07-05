import { nanoid } from 'nanoid';
import { NodeImpl, nodeDefinition } from '../NodeImpl';
import { coerceTypeOptional } from '../..';
import dedent from 'ts-dedent';
export class AbortGraphNodeImpl extends NodeImpl {
    static create() {
        const chartNode = {
            type: 'abortGraph',
            title: 'Graph Output',
            id: nanoid(),
            visualData: {
                x: 0,
                y: 0,
                width: 200,
            },
            data: {
                successfully: true,
                errorMessage: '',
            },
        };
        return chartNode;
    }
    getInputDefinitions() {
        const inputs = [
            {
                id: 'data',
                title: 'Data or Error',
                dataType: 'any',
            },
        ];
        if (this.data.useSuccessfullyInput) {
            inputs.push({
                id: 'successfully',
                title: 'Successfully',
                dataType: 'boolean',
            });
        }
        return inputs;
    }
    getOutputDefinitions() {
        return [];
    }
    getEditors() {
        return [
            {
                type: 'toggle',
                label: 'Successfully Abort',
                dataKey: 'successfully',
                useInputToggleDataKey: 'useSuccessfullyInput',
            },
            {
                type: 'string',
                label: 'Error Message (if not successfully aborting)',
                dataKey: 'errorMessage',
            },
        ];
    }
    getBody() {
        return dedent `
      ${this.data.useSuccessfullyInput
            ? 'Success depends on input'
            : this.data.successfully
                ? 'Successfully Abort'
                : this.data.errorMessage
                    ? `Error Abort: ${this.data.errorMessage}`
                    : 'Error Abort'}
    `;
    }
    async process(inputs, context) {
        const successfully = this.data.useSuccessfullyInput
            ? coerceTypeOptional(inputs['successfully'], 'boolean') ?? this.data.successfully
            : this.data.successfully;
        if (successfully) {
            context.abortGraph();
        }
        else {
            const errorMessage = (coerceTypeOptional(inputs['data'], 'string')?.trim() || this.data.errorMessage) ??
                'Graph aborted with error';
            context.abortGraph(errorMessage);
        }
        return {};
    }
}
export const abortGraphNode = nodeDefinition(AbortGraphNodeImpl, 'Abort Graph');
