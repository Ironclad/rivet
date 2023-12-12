import { nanoid } from 'nanoid/non-secure';
import { dedent } from 'ts-dedent';
import { AssemblyAI, type LemurTaskParams } from 'assemblyai';
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
import { coerceTypeOptional } from '../../utils/coerceType.js';

export type LemurTaskNode = ChartNode<'assemblyAiLemurTask', LemurTaskNodeData>;

export type LemurTaskNodeData = LemurNodeData & {
  prompt?: string;
};

export const LemurTaskNodeImpl: PluginNodeImpl<LemurTaskNode> = {
  create(): LemurTaskNode {
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
        final_model: 'default',
      },
    };

    return chartNode;
  },

  getInputDefinitions(): NodeInputDefinition[] {
    return [
      lemurTranscriptIdsInputDefinition,
      {
        id: 'prompt' as PortId,
        dataType: 'string',
        title: 'Prompt',
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

  getEditors(): EditorDefinition<LemurTaskNode>[] {
    return [
      {
        type: 'string',
        label: 'Prompt',
        dataKey: 'prompt',
      },
      ...(lemurEditorDefinitions as unknown as EditorDefinition<LemurTaskNode>[]),
    ];
  },

  getBody(): string | undefined {
    return '';
  },

  getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`Use AssemblyAI LeMUR Custom Task to ask anything.`,
      infoBoxTitle: 'Use AssemblyAI LeMUR Custom Task',
      contextMenuTitle: 'LeMUR Custom Task',
      group: ['AI', 'AssemblyAI'],
    };
  },

  async process(data, inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const apiKey = getApiKey(context);
    const client = new AssemblyAI({ apiKey });
    const params: LemurTaskParams = {
      prompt: coerceTypeOptional(inputs['prompt' as PortId], 'string') || data.prompt || '',
      ...getLemurParams(inputs, data),
    };
    if (!params.prompt) throw new Error('Prompt must be provided.');

    const { response } = await client.lemur.task(params);

    return {
      ['response' as PortId]: {
        type: 'string',
        value: response,
      },
    };
  },
};

export const lemurTaskNode = pluginNodeDefinition(LemurTaskNodeImpl, 'LeMUR Task');
