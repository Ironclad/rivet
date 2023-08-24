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
  coerceTypeOptional,
  nodeDefinition,
} from '../../index.js';
import { LemurNodeData, LemurParams, getApiKey, getLemurParams, lemurEditorDefinitions } from './lemurHelpers.js';

export type LemurTaskNode = ChartNode<'assemblyAiLemurTask', LemurTaskNodeData>;

export type LemurTaskNodeData = LemurNodeData & {
  prompt?: string;
};

export class LemurTaskNodeImpl extends NodeImpl<LemurTaskNode> {
  static create(): LemurTaskNode {
    const chartNode: LemurTaskNode = {
      type: 'assemblyAiLemurTask',
      title: 'LeMUR Task',
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
        id: 'prompt' as PortId,
        dataType: 'string',
        title: 'Prompt',
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

  getEditors(): EditorDefinition<LemurTaskNode>[] {
    return [
      {
        type: 'string',
        label: 'Prompt',
        dataKey: 'prompt'
      },
      ...lemurEditorDefinitions as unknown as EditorDefinition<LemurTaskNode>[]
    ];
  }

  getBody(): string | undefined {
    return '';
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`Use AssemblyAI LeMUR Custom Task to ask anything.`,
      infoBoxTitle: 'Use AssemblyAI LeMUR Custom Task',
      contextMenuTitle: 'LeMUR Custom Task',
      group: ['AI', 'AssemblyAI'],
    };
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const apiKey = getApiKey(context);
    const params: Omit<LemurParams, 'context'> & {
      prompt: string,
    } = {
      prompt: coerceTypeOptional(inputs['prompt' as PortId], 'string') || this.chartNode.data.prompt || '',
      ...getLemurParams(inputs, this.chartNode.data)
    };
    if (!params.prompt) throw new Error('Prompt must be provided.');

    const { response } = await runLemurTask(apiKey, params);

    return {
      ['response' as PortId]: {
        type: 'string',
        value: response,
      },
    };
  }
}

async function runLemurTask(
  apiToken: string,
  params: object
) {
  const response = await fetch('https://api.assemblyai.com/lemur/v3/generate/task',
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
    throw new Error(`LeMUR Task failed with status ${response.status}`);
  }

  return body as { response: string };
}

export const lemurTaskNode = nodeDefinition(LemurTaskNodeImpl, 'LeMUR Task');
