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

export type LemurActionItemsNode = ChartNode<'assemblyAiLemurActionItems', LemurActionItemsNodeData>;

export type LemurActionItemsNodeData = LemurNodeData & {
  answer_format?: string;
};

export class LemurActionItemsNodeImpl extends NodeImpl<LemurActionItemsNode> {
  static create(): LemurActionItemsNode {
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

  getEditors(): EditorDefinition<LemurActionItemsNode>[] {
    return [
      {
        type: 'string',
        label: 'Context',
        dataKey: 'context'
      },
      ...lemurEditorDefinitions as unknown as EditorDefinition<LemurActionItemsNode>[]
    ];
  }

  getBody(): string | undefined {
    return '';
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`Use AssemblyAI LeMUR Action Items to extract action items`,
      infoBoxTitle: 'Use AssemblyAI LeMUR Action Items',
      contextMenuTitle: 'LeMUR Action Items',
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

    const { response } = await runLemurActionItems(apiKey, params);

    return {
      ['response' as PortId]: {
        type: 'string',
        value: response,
      },
    };
  }
}

async function runLemurActionItems(
  apiToken: string,
  params: object
) {
  const response = await fetch('https://api.assemblyai.com/lemur/v3/generate/action-items',
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
    throw new Error(`LeMUR Action Items failed with status ${response.status}`);
  }

  return body as { response: string };
}

export const lemurActionItemsNode = nodeDefinition(LemurActionItemsNodeImpl, 'LeMUR Action Items');
