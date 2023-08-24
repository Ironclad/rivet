import { nanoid } from 'nanoid';
import { dedent } from 'ts-dedent';
import {
  ChartNode,
  EditorDefinition,
  Inputs,
  InternalProcessContext,
  NodeId,
  NodeImpl,
  NodeInputDefinition,
  NodeOutputDefinition,
  NodeUIData,
  Outputs,
  PortId,
  nodeDefinition,
} from '../../index.js';
import { LemurNodeData, LemurParams, getApiKey, getLemurParams, lemurEditorDefinitions } from './lemurHelpers.js';

export type LemurSummaryNode = ChartNode<'assemblyAiLemurSummary', LemurSummaryNodeData>;

export type LemurSummaryNodeData = LemurNodeData & {
  answer_format?: string;
};

export class LemurSummaryNodeImpl extends NodeImpl<LemurSummaryNode> {
  static create(): LemurSummaryNode {
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
        final_model: 'default'
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    return [
      {
        id: 'transcript_ids' as PortId,
        dataType: ['string', 'string[]'],
        title: 'Transcript IDs',
      },
      {
        id: 'context' as PortId,
        dataType: 'string',
        title: 'Context',
      }
    ];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        dataType: 'string',
        id: 'response' as PortId,
        title: 'Response',
      },
    ];
  }

  getEditors(): EditorDefinition<LemurSummaryNode>[] {
    return [
      {
        type: 'string',
        label: 'Context',
        dataKey: 'context'
      },
      ...lemurEditorDefinitions as unknown as EditorDefinition<LemurSummaryNode>[]
    ];
  }

  getBody(): string | undefined {
    return '';
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`Use AssemblyAI LeMUR Summary to summarize transcripts`,
      infoBoxTitle: 'Use AssemblyAI LeMUR Summary',
      contextMenuTitle: 'LeMUR Summary',
      group: ['AI', 'AssemblyAI'],
    };
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const apiKey = getApiKey(context);
    const params: LemurParams & {
      answer_format?: string,
    } = getLemurParams(inputs, this.chartNode.data);

    if (this.chartNode.data.answer_format) {
      params.answer_format = this.chartNode.data.answer_format;
    }

    const { response } = await runLemurSummary(apiKey, params);

    return {
      ['response' as PortId]: {
        type: 'string',
        value: response,
      },
    };
  }
}

async function runLemurSummary(
  apiToken: string,
  params: object
) {
  const response = await fetch('https://api.assemblyai.com/lemur/v3/generate/summary',
    {
      method: 'POST',
      body: JSON.stringify(params),
      headers: {
        authorization: apiToken
      }
    }
  );
  const body = await response.json();
  if (response.status !== 200) {
    if ('error' in body) throw new Error(body.error);
    throw new Error(`LeMUR Summary failed with status ${response.status}`);
  }

  return body as { response: string };
}

export const lemurSummaryNode = nodeDefinition(LemurSummaryNodeImpl, 'LeMUR Summary');
