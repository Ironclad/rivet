import { NodeImpl, nodeDefinition } from '../../model/NodeImpl';
import { chunkStringByTokenCount, modelOptions, modelToTiktokenModel } from '../../utils/tokenizer';
import { nanoid } from 'nanoid';
import { coerceType } from '../../utils/coerceType';
export class ChunkNodeImpl extends NodeImpl {
    static create() {
        const chartNode = {
            type: 'chunk',
            title: 'Chunk',
            id: nanoid(),
            visualData: {
                x: 0,
                y: 0,
                width: 200,
            },
            data: {
                model: 'gpt-3.5-turbo',
                useModelInput: false,
                numTokensPerChunk: 1024,
                overlap: 0,
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
            },
        ];
    }
    getOutputDefinitions() {
        return [
            {
                id: 'chunks',
                title: 'Chunks',
                dataType: 'string[]',
            },
            {
                id: 'first',
                title: 'First',
                dataType: 'string',
            },
            {
                id: 'last',
                title: 'Last',
                dataType: 'string',
            },
            {
                id: 'indexes',
                title: 'Indexes',
                dataType: 'number[]',
            },
            {
                id: 'count',
                title: 'Count',
                dataType: 'number',
            },
        ];
    }
    getEditors() {
        return [
            {
                type: 'dropdown',
                label: 'Model',
                dataKey: 'model',
                options: modelOptions,
                useInputToggleDataKey: 'useModelInput',
            },
            {
                type: 'number',
                label: 'Number of tokens per chunk',
                dataKey: 'numTokensPerChunk',
                min: 1,
                max: 32768,
                step: 1,
            },
            {
                type: 'number',
                label: 'Overlap (in %)',
                dataKey: 'overlap',
                min: 0,
                max: 100,
                step: 1,
            },
        ];
    }
    async process(inputs) {
        const input = coerceType(inputs['input'], 'string');
        const overlapPercent = this.chartNode.data.overlap / 100;
        const chunked = chunkStringByTokenCount(input, this.chartNode.data.numTokensPerChunk, modelToTiktokenModel[this.chartNode.data.model], overlapPercent);
        return {
            ['chunks']: {
                type: 'string[]',
                value: chunked,
            },
            ['first']: {
                type: 'string',
                value: chunked[0],
            },
            ['last']: {
                type: 'string',
                value: chunked.at(-1),
            },
            ['indexes']: {
                type: 'number[]',
                value: chunked.map((_, i) => i + 1),
            },
            ['count']: {
                type: 'number',
                value: chunked.length,
            },
        };
    }
}
export const chunkNode = nodeDefinition(ChunkNodeImpl, 'Chunk');
