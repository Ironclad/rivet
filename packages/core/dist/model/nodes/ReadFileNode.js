import { NodeImpl, nodeDefinition } from '../NodeImpl';
import { nanoid } from 'nanoid';
import { expectType } from '../..';
export class ReadFileNodeImpl extends NodeImpl {
    static create() {
        return {
            id: nanoid(),
            type: 'readFile',
            title: 'Read File',
            visualData: { x: 0, y: 0, width: 250 },
            data: {
                path: '',
                usePathInput: true,
                errorOnMissingFile: false,
            },
        };
    }
    getInputDefinitions() {
        const inputDefinitions = [];
        if (this.chartNode.data.usePathInput) {
            inputDefinitions.push({
                id: 'path',
                title: 'Path',
                dataType: 'string',
            });
        }
        return inputDefinitions;
    }
    getOutputDefinitions() {
        return [
            {
                id: 'content',
                title: 'Content',
                dataType: 'string',
            },
        ];
    }
    async process(inputData, context) {
        const path = this.chartNode.data.usePathInput
            ? expectType(inputData['path'], 'string')
            : this.chartNode.data.path;
        try {
            const content = await context.nativeApi.readTextFile(path, undefined);
            return {
                ['content']: { type: 'string', value: content },
            };
        }
        catch (err) {
            if (this.chartNode.data.errorOnMissingFile) {
                throw err;
            }
            else {
                return {
                    ['content']: { type: 'string', value: '(file does not exist)' },
                };
            }
        }
    }
}
export const readFileNode = nodeDefinition(ReadFileNodeImpl, 'Read File');
