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

function getTranscriptIds(inputs: Inputs): string[] {
  const input = inputs['transcript_ids' as PortId] as
    | StringDataValue
    | StringArrayDataValue
    | AnyDataValue
    | ArrayDataValue<AnyDataValue>;
  if (!input) throw new Error('Transcript IDs are required.');

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

export function getApiKey(context: InternalProcessContext) {
  const apiKey = context.getPluginConfig('assemblyAiApiKey');
  if (!apiKey) {
    throw new Error('AssemblyAI API key not set.');
  }
  return apiKey;
}

export function getLemurParams(inputs: Inputs, editorData: LemurNodeData): LemurBaseParams {
  const params: LemurBaseParams = {
    transcript_ids: getTranscriptIds(inputs),
    context: coerceTypeOptional(inputs['context' as PortId], 'string') || editorData.context || undefined,
    final_model: editorData.final_model && editorData.final_model !== 'default' ? editorData.final_model : undefined,
    max_output_size: editorData.max_output_size,
  };

  return params;
}

export const lemurTranscriptIdsInputDefinition = {
  id: 'transcript_ids' as PortId,
  dataType: ['string', 'string[]', 'any', 'any[]'],
  title: 'Transcript IDs',
} as const;

export const lemurEditorDefinitions = [
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
    ],
  },
  {
    type: 'number',
    label: 'Maximum Output Size',
    dataKey: 'max_output_size',
  },
] as const;

export type FinalModel = 'default' | 'basic';

export type LemurNodeData = {
  context?: string;
  final_model?: FinalModel;
  max_output_size?: number;
};
