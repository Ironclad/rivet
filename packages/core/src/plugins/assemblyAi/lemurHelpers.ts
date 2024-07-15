import { AssemblyAI } from 'assemblyai';
import type { LemurBaseParams } from 'assemblyai';
import {
  type AnyDataValue,
  type ArrayDataValue,
  type Inputs,
  type InternalProcessContext,
  type PortId,
  type StringArrayDataValue,
  type StringDataValue,
} from '../../index.js';
import { coerceType, coerceTypeOptional } from '../../utils/coerceType.js';

function getTranscriptIds(inputs: Inputs): string[] | undefined {
  const input = inputs['transcript_ids' as PortId] as
    | StringDataValue
    | StringArrayDataValue
    | AnyDataValue
    | ArrayDataValue<AnyDataValue>;
  if (!input) return undefined;

  if (input.type === 'string' || (input.type === 'any' && typeof input.value === 'string')) {
    return [coerceType(input, 'string')];
  } else if (
    input.type === 'string[]' ||
    input.type === 'any[]' ||
    (input.type === 'any' && Array.isArray(input.value))
  ) {
    return coerceType(input, 'string[]');
  }
  throw new Error('Transcript IDs must be a string or string[] of transcript IDs.');
}

const userAgent = {
  integration: {
    name: 'Rivet',
    version: '1.0.1',
  },
};
export function getClient(context: InternalProcessContext): AssemblyAI {
  const apiKey = context.getPluginConfig('assemblyAiApiKey');
  if (!apiKey) {
    throw new Error('AssemblyAI API key not set.');
  }
  return new AssemblyAI({ apiKey, userAgent });
}

export function getLemurParams(inputs: Inputs, editorData: LemurNodeData): LemurBaseParams {
  const params: LemurBaseParams = {
    transcript_ids: getTranscriptIds(inputs),
    input_text: coerceTypeOptional(inputs['input_text' as PortId], 'string'),
    context: coerceTypeOptional(inputs['context' as PortId], 'string') || editorData.context || undefined,
    final_model: editorData.final_model && editorData.final_model !== 'default' ? editorData.final_model : undefined,
    max_output_size: editorData.max_output_size,
    temperature: editorData.temperature,
  };

  return params;
}

export const lemurInputDefinitions = [
  {
    id: 'transcript_ids' as PortId,
    dataType: ['string', 'string[]', 'any', 'any[]'],
    title: 'Transcript IDs',
  },
  {
    id: 'input_text' as PortId,
    dataType: ['string'],
    title: 'Input Text',
  },
] as const;

export const lemurEditorDefinitions = [
  {
    type: 'dropdown',
    label: 'Final Model',
    dataKey: 'final_model',
    options: [
      {
        value: 'anthropic/claude-3-5-sonnet',
        label: 'Claude 3.5 Sonnet (on Anthropic)',
      },
      {
        value: 'anthropic/claude-3-opus',
        label: 'Claude 3 Opus (on Anthropic)',
      },
      {
        value: 'anthropic/claude-3-haiku',
        label: 'Claude 3 Haiku (on Anthropic)',
      },
      {
        value: 'anthropic/claude-3-sonnet',
        label: 'Claude 3 Sonnet (on Anthropic)',
      },
      {
        value: 'anthropic/claude-2-1',
        label: 'Claude 2.1 (on Anthropic)',
      },
      {
        value: 'anthropic/claude-2',
        label: 'Claude 2.1 (on Anthropic)',
      },
      {
        value: 'default',
        label: 'Default',
      },
      {
        value: 'anthropic/claude-instant-1-2',
        label: 'Claude Instant 1.2 (on Anthropic)',
      },
      {
        value: 'basic',
        label: 'Basic',
      },
      {
        value: 'assemblyai/mistral-7b',
        label: 'Mistral 7B (hosted by AssemblyAI)',
      },
    ],
  },
  {
    type: 'number',
    label: 'Maximum Output Size',
    dataKey: 'max_output_size',
  },
  {
    type: 'number',
    label: 'Temperature',
    dataKey: 'temperature',
    min: 0,
    max: 1,
  },
] as const;

export type FinalModel =
  | 'anthropic/claude-3-5-sonnet'
  | 'anthropic/claude-3-opus'
  | 'anthropic/claude-3-haiku'
  | 'anthropic/claude-3-sonnet'
  | 'anthropic/claude-2-1'
  | 'anthropic/claude-2'
  | 'default'
  | 'anthropic/claude-instant-1-2'
  | 'basic'
  | 'assemblyai/mistral-7b';

export type LemurNodeData = {
  context?: string;
  final_model?: FinalModel;
  max_output_size?: number;
  temperature?: number;
};
