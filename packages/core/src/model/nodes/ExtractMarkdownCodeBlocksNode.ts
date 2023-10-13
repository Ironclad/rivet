import {
  type ChartNode,
  type NodeId,
  type NodeInputDefinition,
  type PortId,
  type NodeOutputDefinition,
} from '../NodeBase.js';
import { nanoid } from 'nanoid/non-secure';
import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import { nodeDefinition } from '../NodeDefinition.js';
import { expectType } from '../../utils/expectType.js';
import type { Inputs, Outputs } from '../GraphProcessor.js';
import { dedent } from 'ts-dedent';

export type ExtractMarkdownCodeBlocksNode = ChartNode<'extractMarkdownCodeBlocks', {}>;

export class ExtractMarkdownCodeBlocksNodeImpl extends NodeImpl<ExtractMarkdownCodeBlocksNode> {
  static create(): ExtractMarkdownCodeBlocksNode {
    const chartNode: ExtractMarkdownCodeBlocksNode = {
      type: 'extractMarkdownCodeBlocks',
      title: 'Extract Markdown Code Blocks',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 250,
      },
      data: {},
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    return [
      {
        id: 'input' as PortId,
        title: 'Input',
        dataType: 'string',
        required: true,
      },
    ];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'firstBlock' as PortId,
        title: 'First Block',
        dataType: 'string',
      },
      {
        id: 'allBlocks' as PortId,
        title: 'All Blocks',
        dataType: 'string[]',
      },
      {
        id: 'languages' as PortId,
        title: 'Languages',
        dataType: 'string[]',
      },
    ];
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Extracts the code blocks in the input Markdown text.

        Outputs the first matched block, all matched blocks, and the languages specified for the blocks.
      `,
      infoBoxTitle: 'Extract Markdown Code Blocks Node',
      contextMenuTitle: 'Extract Markdown Code Blocks',
      group: ['Text'],
    };
  }

  async process(inputs: Inputs): Promise<Outputs> {
    const inputString = expectType(inputs['input' as PortId], 'string');

    const regex = /```(\w*)\n([\s\S]*?)```/g;
    let match;
    let firstBlock: string | undefined;
    const allBlocks = [];
    const languages = [];

    while ((match = regex.exec(inputString)) !== null) {
      const language = match[1];
      const block = match[2];

      if (!firstBlock) {
        firstBlock = block!;
      }

      allBlocks.push(block!);
      languages.push(language!);
    }

    return {
      ['firstBlock' as PortId]:
        firstBlock == null
          ? {
              type: 'control-flow-excluded',
              value: undefined,
            }
          : {
              type: 'string',
              value: firstBlock,
            },
      ['allBlocks' as PortId]: {
        type: 'string[]',
        value: allBlocks,
      },
      ['languages' as PortId]: {
        type: 'string[]',
        value: languages,
      },
    };
  }
}

export const extractMarkdownCodeBlocksNode = nodeDefinition(
  ExtractMarkdownCodeBlocksNodeImpl,
  'Extract Markdown Code Blocks',
);
