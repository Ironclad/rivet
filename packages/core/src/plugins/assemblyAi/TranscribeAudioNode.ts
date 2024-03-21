import { nanoid } from 'nanoid/non-secure';
import { dedent } from 'ts-dedent';
import { AssemblyAI } from 'assemblyai';
import type { TranscriptParams } from 'assemblyai';
import {
  type AnyDataValue,
  type AudioDataValue,
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
  type StringDataValue,
} from '../../index.js';
import { getApiKey } from './lemurHelpers.js';
import { pluginNodeDefinition } from '../../model/NodeDefinition.js';
import { coerceType } from '../../utils/coerceType.js';

export type TranscribeAudioNode = ChartNode<'assemblyAiTranscribeAudio', TranscribeAudioNodeData>;

export type TranscribeAudioNodeData = {
  transcriptParameters?: string;
};

export const TranscribeAudioNodeImpl: PluginNodeImpl<TranscribeAudioNode> = {
  create(): TranscribeAudioNode {
    const chartNode: TranscribeAudioNode = {
      type: 'assemblyAiTranscribeAudio',
      title: 'Transcribe Audio',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 250,
      },
      data: {},
    };

    return chartNode;
  },

  getInputDefinitions(): NodeInputDefinition[] {
    return [
      {
        id: 'audio' as PortId,
        dataType: ['audio', 'string'],
        title: 'Audio',
      },
    ];
  },

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        dataType: 'string',
        id: 'text' as PortId,
        title: 'Transcript text',
      },
      {
        dataType: 'string',
        id: 'id' as PortId,
        title: 'Transcript ID',
      },
      {
        dataType: 'object',
        id: 'transcript' as PortId,
        title: 'Transcript object',
      },
    ];
  },

  getEditors(): EditorDefinition<TranscribeAudioNode>[] {
    return [
      {
        type: 'code',
        label: 'Transcript Parameters (JSON)',
        language: 'json',
        dataKey: 'transcriptParameters',
        helperMessage: `Configure additional parameters using a JSON object. This will override any other fields you have set.
        For a detailed list of parameters, see [the AssemblyAI API documentation](https://www.assemblyai.com/docs/api-reference/transcript#create-a-transcript).`,
      },
    ];
  },

  getBody(): string | undefined {
    return '';
  },

  getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`Use AssemblyAI to transcribe audio`,
      infoBoxTitle: 'Transcribe Audio Node',
      contextMenuTitle: 'Transcribe Audio',
      group: ['AI', 'AssemblyAI'],
    };
  },

  async process(data, inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const input = inputs['audio' as PortId] as AudioDataValue | StringDataValue | AnyDataValue;
    if (!input) throw new Error('Audio input is required.');

    const apiKey = getApiKey(context);
    const client = new AssemblyAI({ apiKey });

    let audioUrl: string;
    if (input.type === 'audio') {
      const audio = coerceType(inputs['audio' as PortId], 'audio');
      audioUrl = await client.files.upload(audio.data);
    } else if (input.type === 'string' || input.type === 'any') {
      audioUrl = coerceType(inputs['audio' as PortId], 'string');
    } else {
      throw new Error('Audio input must be audio or string containing the audio URL.');
    }

    let transcriptParams: TranscriptParams = { audio: audioUrl };
    transcriptParams = { ...transcriptParams, ...getAdditionalParameters(data) };
    const transcript = await client.transcripts.transcribe(transcriptParams);

    return {
      ['text' as PortId]: {
        type: 'string',
        value: transcript.text as string,
      },
      ['id' as PortId]: {
        type: 'string',
        value: transcript.id,
      },
      ['transcript' as PortId]: {
        type: 'object',
        value: transcript,
      },
    };
  },
};

export const transcribeAudioNode = pluginNodeDefinition(TranscribeAudioNodeImpl, 'Transcribe Audio');

function getAdditionalParameters(data: TranscribeAudioNodeData): Partial<TranscriptParams> {
  const transcriptParams: string | null | undefined = data.transcriptParameters?.trim();
  if (!transcriptParams) {
    return {};
  }

  let transcriptParamsObj: Array<unknown> | Partial<TranscriptParams>;
  try {
    transcriptParamsObj = JSON.parse(transcriptParams);
  } catch (e) {
    throw new Error('The transcript parameters field has to be a valid JSON object, or empty.'); // This message is surfaced to the user
  }

  if (Array.isArray(transcriptParamsObj)) {
    throw new Error('The transcript parameters field should be a JSON object, but is a JSON array'); // This message is surfaced to the user
  }

  return transcriptParamsObj;
}
