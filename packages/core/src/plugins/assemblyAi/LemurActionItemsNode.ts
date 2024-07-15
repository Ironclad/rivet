import { nanoid } from 'nanoid/non-secure';
import { dedent } from 'ts-dedent';
import type { LemurActionItemsParams } from 'assemblyai';
import {
  type ChartNode,
  type EditorDefinition,
  type Inputs,
  type InternalProcessContext,
  type NodeId,
  type NodeInputDefinition,
  type NodeOutputDefinition,
  type NodeUIData,
  type Outputs,
  type PluginNodeImpl,
  type PortId,
} from '../../index.js';
import { pluginNodeDefinition } from '../../model/NodeDefinition.js';
import {
  type LemurNodeData,
  getClient,
  getLemurParams,
  lemurEditorDefinitions,
  lemurInputDefinitions,
} from './lemurHelpers.js';

export type LemurActionItemsNode = ChartNode<'assemblyAiLemurActionItems', LemurActionItemsNodeData>;

export type LemurActionItemsNodeData = LemurNodeData;

export const LemurActionItemsNodeImpl: PluginNodeImpl<LemurActionItemsNode> = {
  create(): LemurActionItemsNode {
    const chartNode: LemurActionItemsNode = {
      type: 'assemblyAiLemurActionItems',
      title: 'LeMUR Action Items',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 250,
      },
      data: {
        final_model: 'default',
      },
    };

    return chartNode;
  },

  getInputDefinitions(): NodeInputDefinition[] {
    return [
      ...lemurInputDefinitions,
      {
        id: 'context' as PortId,
        dataType: 'string',
        title: 'Context',
      },
    ];
  },

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        dataType: 'string',
        id: 'response' as PortId,
        title: 'Response',
      },
    ];
  },

  getEditors(): EditorDefinition<LemurActionItemsNode>[] {
    return [
      {
        type: 'string',
        label: 'Context',
        dataKey: 'context',
      },
      ...(lemurEditorDefinitions as unknown as EditorDefinition<LemurActionItemsNode>[]),
    ];
  },

  getBody(): string | undefined {
    return '';
  },

  getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`Use AssemblyAI LeMUR Action Items to extract action items`,
      infoBoxTitle: 'Use AssemblyAI LeMUR Action Items',
      contextMenuTitle: 'LeMUR Action Items',
      group: ['AI', 'AssemblyAI'],
    };
  },

  async process(data, inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const client = getClient(context);

    const params: LemurActionItemsParams = getLemurParams(inputs, data);

    const { response } = await client.lemur.actionItems(params);

    return {
      ['response' as PortId]: {
        type: 'string',
        value: response,
      },
    };
  },
};

export const lemurActionItemsNode = pluginNodeDefinition(LemurActionItemsNodeImpl, 'LeMUR Action Items');
