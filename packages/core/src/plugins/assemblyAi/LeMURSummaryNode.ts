import { nanoid } from 'nanoid';
import { dedent } from 'ts-dedent';
import {
  AnyDataValue,
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
  StringArrayDataValue,
  StringDataValue,
  coerceType,
  nodeDefinition,
} from '../../index.js';

export type LeMURSummaryNode = ChartNode<'assemblyAiLeMURSummary', LeMURSummaryNodeData>;

export type LeMURSummaryNodeData = {
  answer_format?: string;
  final_model?: string;
  max_output_size?: number;
};

export class LeMURSummaryNodeImpl extends NodeImpl<LeMURSummaryNode> {
  static create(): LeMURSummaryNode {
    const chartNode: LeMURSummaryNode = {
      type: 'assemblyAiLeMURSummary',
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

  getEditors(): EditorDefinition<LeMURSummaryNode>[] {
    return [
      {
        type: 'string',
        label: 'Answer Format',
        dataKey: 'answer_format'
      },
      {
        type: 'dropdown',
        label: 'Final Model',
        dataKey: 'final_model',
        options: [
          {
            value: 'default',
            label: 'Default',
          },
          {
            value: 'basic',
            label: 'Basic',
          },
        ]
      },
      {
        type: 'number',
        label: 'Maximum Output Size',
        dataKey: 'max_output_size'
      },
    ];
  }

  getBody(): string | undefined {
    return '';
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`Use AssemblyAI LeMUR Summary to apply LLM tasks to audio`,
      infoBoxTitle: 'Use AssemblyAI LeMUR Summary',
      contextMenuTitle: 'LeMUR Summary',
      group: 'AI',
    };
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const input = inputs['transcript_ids' as PortId] as StringDataValue | StringArrayDataValue | AnyDataValue;
    if (!input) throw new Error('Transcript IDs are required.');

    const apiKey = context.getPluginConfig('assemblyAiApiKey');

    if (!apiKey) {
      throw new Error('AssemblyAI API key not set.');
    }

    let transcriptIds: string[];
    if (input.type === 'string' || input.type === 'any') {
      transcriptIds = [coerceType(inputs['transcript_ids' as PortId], 'string')];
    } else if (input.type === 'string[]') {
      transcriptIds = coerceType(inputs['transcript_ids' as PortId], 'string[]');
    } else {
      throw new Error('Audio input must be a string or string[] of transcript IDs.');
    }

    const params: {
      transcript_ids: string[],
      context?: string,
      answer_format?: string,
      final_model?: string,
      max_output_size?: number
    } = {
      transcript_ids: transcriptIds
    };
    if (this.chartNode.data.answer_format) {
      params.answer_format = this.chartNode.data.answer_format;
    }
    if (this.chartNode.data.final_model !== 'default') {
      params.answer_format = this.chartNode.data.final_model;
    }
    if (this.chartNode.data.max_output_size) {
      params.max_output_size = this.chartNode.data.max_output_size;
    }

    const { response } = await runLeMURSummary(apiKey, params);

    return {
      ['response' as PortId]: {
        type: 'string',
        value: response,
      },
    };
  }
}

async function runLeMURSummary(
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

export const leMURSummaryNode = nodeDefinition(LeMURSummaryNodeImpl, 'LeMUR Summary');
