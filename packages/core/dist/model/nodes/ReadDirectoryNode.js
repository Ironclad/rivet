import { NodeImpl } from '../NodeImpl';
import { nanoid } from 'nanoid';
import { expectType } from '../..';
export class ReadDirectoryNodeImpl extends NodeImpl {
    static create() {
        return {
            id: nanoid(),
            type: 'readDirectory',
            title: 'Read Directory',
            visualData: { x: 0, y: 0 },
            data: {
                path: 'examples',
                recursive: false,
                usePathInput: false,
                useRecursiveInput: false,
                includeDirectories: false,
                useIncludeDirectoriesInput: false,
                filterGlobs: [],
                useFilterGlobsInput: false,
                relative: false,
                useRelativeInput: false,
                ignores: [],
                useIgnoresInput: false,
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
                required: true,
            });
        }
        if (this.chartNode.data.useRecursiveInput) {
            inputDefinitions.push({
                id: 'recursive',
                title: 'Recursive',
                dataType: 'boolean',
                required: true,
            });
        }
        if (this.chartNode.data.useIncludeDirectoriesInput) {
            inputDefinitions.push({
                id: 'includeDirectories',
                title: 'Include Directories',
                dataType: 'boolean',
                required: true,
            });
        }
        if (this.chartNode.data.useFilterGlobsInput) {
            inputDefinitions.push({
                id: 'filterGlobs',
                title: 'Filter Globs',
                dataType: 'string[]',
                required: true,
            });
        }
        if (this.chartNode.data.useRelativeInput) {
            inputDefinitions.push({
                id: 'relative',
                title: 'Relative',
                dataType: 'boolean',
                required: true,
            });
        }
        return inputDefinitions;
    }
    getOutputDefinitions() {
        return [
            {
                id: 'rootPath',
                title: 'Root Path',
                dataType: 'string',
            },
            {
                id: 'paths',
                title: 'Paths',
                dataType: 'string[]',
            },
        ];
    }
    async process(inputData, context) {
        const path = this.chartNode.data.usePathInput
            ? expectType(inputData['path'], 'string')
            : this.chartNode.data.path;
        const recursive = this.chartNode.data.useRecursiveInput
            ? expectType(inputData['recursive'], 'boolean')
            : this.chartNode.data.recursive;
        const includeDirectories = this.chartNode.data.useIncludeDirectoriesInput
            ? expectType(inputData['includeDirectories'], 'boolean')
            : this.chartNode.data.includeDirectories;
        const filterGlobs = this.chartNode.data.useFilterGlobsInput
            ? expectType(inputData['filterGlobs'], 'string[]')
            : this.chartNode.data.filterGlobs;
        const relative = this.chartNode.data.useRelativeInput
            ? expectType(inputData['relative'], 'boolean')
            : this.chartNode.data.relative;
        const ignores = this.chartNode.data.useIgnoresInput
            ? expectType(inputData['ignores'], 'string[]')
            : this.chartNode.data.ignores;
        // Can be slow, assume a directory doesn't change during execution
        // TODO once this is at auto-gpt level changing files, will need to rethink, but good enough
        // for now
        const cacheKey = `ReadDirectoryNode-${path}-${recursive}-${includeDirectories}-${filterGlobs.join()}-${relative}-${ignores?.join()}`;
        const cached = context.executionCache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const files = await context.nativeApi.readdir(path, undefined, {
            recursive,
            includeDirectories,
            filterGlobs,
            relative,
            ignores,
        });
        const outputs = {
            ['paths']: { type: 'string[]', value: files },
            ['rootPath']: { type: 'string', value: path },
        };
        context.executionCache.set(cacheKey, outputs);
        return outputs;
    }
}
