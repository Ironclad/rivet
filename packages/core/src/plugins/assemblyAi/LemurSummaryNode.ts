import { nanoid } from 'nanoid/non-secure';
import { dedent } from 'ts-dedent';
import { AssemblyAI, type LemurSummaryParams } from 'assemblyai';
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
import {
  type LemurNodeData,
  getApiKey,
  getLemurParams,
  lemurEditorDefinitions,
  lemurTranscriptIdsInputDefinition,
} from './lemurHelpers.js';
import { pluginNodeDefinition } from '../../model/NodeDefinition.js';

export type LemurSummaryNode = ChartNode<'assemblyAiLemurSummary', LemurSummaryNodeData>;

export type LemurSummaryNodeData = LemurNodeData & {
  answer_format?: string;
};

export const LemurSummaryNodeImpl: PluginNodeImpl<LemurSummaryNode> = {
  create(): LemurSummaryNode {
    const chartNode: LemurSummaryNode = {
      type: 'assemblyAiLemurSummary',
      title: 'LeMUR Summary',
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
      lemurTranscriptIdsInputDefinition,
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

  getEditors(): EditorDefinition<LemurSummaryNode>[] {
    return [
      {
        type: 'string',
        label: 'Context',
        dataKey: 'context',
      },
      ...(lemurEditorDefinitions as unknown as EditorDefinition<LemurSummaryNode>[]),
    ];
  },

  getBody(): string | undefined {
    return '';
  },

  getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`Use AssemblyAI LeMUR Summary to summarize transcripts`,
      infoBoxTitle: 'Use AssemblyAI LeMUR Summary',
      contextMenuTitle: 'LeMUR Summary',
      group: ['AI', 'AssemblyAI'],
    };
  },

  async process(data, inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const apiKey = getApiKey(context);
    const client = new AssemblyAI({ apiKey });
    const params: LemurSummaryParams = getLemurParams(inputs, data);

    if (data.answer_format) {
      params.answer_format = data.answer_format;
    }

    const { response } = await client.lemur.summary(params);

    return {
      ['response' as PortId]: {
        type: 'string',
        value: response,
      },
    };
  },
};

export const lemurSummaryNode = pluginNodeDefinition(LemurSummaryNodeImpl, 'LeMUR Summary');
