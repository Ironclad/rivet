import {
  type ChartNode,
  type NodeId,
  type NodeInputDefinition,
  type NodeOutputDefinition,
  type PortId,
} from '../../model/NodeBase.js';
import { NodeImpl, type NodeUIData } from '../../model/NodeImpl.js';
import { nanoid } from 'nanoid/non-secure';
import { coerceType } from '../../utils/coerceType.js';
import { dedent } from 'ts-dedent';
import { openAiModelOptions, openaiModels } from '../../utils/openai.js';
import { type EditorDefinition, type Inputs, type InternalProcessContext, type Outputs } from '../../index.js';
import { nodeDefinition } from '../NodeDefinition.js';
import type { Tokenizer, TokenizerCallInfo } from '../../integrations/Tokenizer.js';

export type ChunkNodeData = {
  numTokensPerChunk: number;

  model: string;
  useModelInput: boolean;

  overlap: number;
};

export type ChunkNode = ChartNode<'chunk', ChunkNodeData>;

export class ChunkNodeImpl extends NodeImpl<ChunkNode> {
  static create() {
    const chartNode: ChunkNode = {
      type: 'chunk',
      title: 'Chunk',
      id: nanoid() as NodeId,
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

  getInputDefinitions(): NodeInputDefinition[] {
    return [
      {
        id: 'input' as PortId,
        title: 'Input',
        dataType: 'string',
      },
    ];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'chunks' as PortId,
        title: 'Chunks',
        dataType: 'string[]',
      },
      {
        id: 'first' as PortId,
        title: 'First',
        dataType: 'string',
      },
      {
        id: 'last' as PortId,
        title: 'Last',
        dataType: 'string',
      },
      {
        id: 'indexes' as PortId,
        title: 'Indexes',
        dataType: 'number[]',
      },
      {
        id: 'count' as PortId,
        title: 'Count',
        dataType: 'number',
      },
    ];
  }

  getEditors(): EditorDefinition<ChunkNode>[] {
    return [
      {
        type: 'dropdown',
        label: 'Model',
        dataKey: 'model',
        options: openAiModelOptions,
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

  getBody(): string | undefined {
    return dedent`
      Model: ${this.data.model}
      Token Count: ${this.data.numTokensPerChunk.toLocaleString()}
      ${this.data.overlap ? `Overlap: ${this.data.overlap}%` : ''}
    `;
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
          Splits the input text into an array of chunks based on an approximate GPT token count per chunk.

          The "overlap" setting allows you to partially overlap the chunks for redundancy.

          Can also be used for string length truncation by only using the \`First\` or \`Last\` outputs of the node.
        `,
      infoBoxTitle: 'Chunk Node',
      contextMenuTitle: 'Chunk',
      group: ['Text'],
    };
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const input = coerceType(inputs['input' as PortId], 'string');

    const overlapPercent = this.chartNode.data.overlap / 100;

    const chunked = chunkStringByTokenCount(
      context.tokenizer,
      {
        node: this.chartNode,
        endpoint: undefined,
        model: this.data.model,
      },
      input,
      this.chartNode.data.numTokensPerChunk,
      overlapPercent,
    );

    return {
      ['chunks' as PortId]: {
        type: 'string[]',
        value: chunked,
      },
      ['first' as PortId]: {
        type: 'string',
        value: chunked[0]!,
      },
      ['last' as PortId]: {
        type: 'string',
        value: chunked.at(-1)!,
      },
      ['indexes' as PortId]: {
        type: 'number[]',
        value: chunked.map((_, i) => i + 1),
      },
      ['count' as PortId]: {
        type: 'number',
        value: chunked.length,
      },
    };
  }
}

export const chunkNode = nodeDefinition(ChunkNodeImpl, 'Chunk');

export function chunkStringByTokenCount(
  tokenizer: Tokenizer,
  tokenizerInfo: TokenizerCallInfo,
  input: string,
  targetTokenCount: number,
  overlapPercent: number,
) {
  overlapPercent = Number.isNaN(overlapPercent) ? 0 : Math.max(0, Math.min(1, overlapPercent));

  const chunks: string[] = [];
  const guess = Math.floor(targetTokenCount * (input.length / tokenizer.getTokenCountForString(input, tokenizerInfo)));
  let remaining = input;

  while (remaining.length > 0) {
    chunks.push(remaining.slice(0, guess));
    remaining = remaining.slice(guess - Math.floor(guess * overlapPercent));
  }

  return chunks;
}
