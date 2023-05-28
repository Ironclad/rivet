import { nanoid } from 'nanoid';
import { NodeImpl } from '../NodeImpl';
export class CodeNodeImpl extends NodeImpl {
    static create(code = `// This is a code node, you can write and JS in here and it will be executed.
// Inputs are accessible via an object \`inputs\` and data is typed (i.e. inputs.foo.type, inputs.foo.value)
// Return an object with named outputs that match the output names specified in the node's config.
// Output values must by typed as well (e.g. { bar: { type: 'string', value: 'bar' } }
return { output: inputs.input };`, inputNames = 'input', outputNames = 'output') {
        const chartNode = {
            type: 'code',
            title: 'Code',
            id: nanoid(),
            visualData: {
                x: 0,
                y: 0,
            },
            data: {
                code,
                inputNames,
                outputNames,
            },
        };
        return chartNode;
    }
    getInputDefinitions() {
        return this.chartNode.data.inputNames.split(',').map((inputName) => {
            return {
                type: 'string',
                id: inputName.trim(),
                title: inputName.trim(),
                dataType: 'string',
                required: false,
            };
        });
    }
    getOutputDefinitions() {
        return this.chartNode.data.outputNames.split(',').map((outputName) => {
            return {
                id: outputName.trim(),
                title: outputName.trim(),
                dataType: 'string',
            };
        });
    }
    async process(inputs) {
        // eslint-disable-next-line no-new-func
        const codeFunction = new Function('inputs', this.chartNode.data.code);
        const outputs = codeFunction(inputs);
        return outputs;
    }
}
