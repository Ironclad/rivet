import { AnyDataValue, ArrayDataValue, Inputs, InternalProcessContext, PortId, StringArrayDataValue, StringDataValue, coerceType, coerceTypeOptional } from "../../index.js";

function getTranscriptIds(inputs: Inputs): string[] {
  const input = inputs['transcript_ids' as PortId] as StringDataValue | StringArrayDataValue | AnyDataValue | ArrayDataValue<AnyDataValue>;
  if (!input) throw new Error('Transcript IDs are required.');

  if (
    input.type === 'string' ||
    (input.type === 'any' && typeof input.value === 'string')
  ) {
    return [coerceType(input, 'string')];
  } else if (
    input.type === 'string[]' ||
    (input.type === 'any' && Array.isArray(input.value))
  ) {
    return coerceType(input, 'string[]');
  }
  throw new Error('Audio input must be a string or string[] of transcript IDs.');
}

export function getApiKey(context: InternalProcessContext) {
  const apiKey = context.getPluginConfig('assemblyAiApiKey');
  if (!apiKey) {
    throw new Error('AssemblyAI API key not set.');
  }
  return apiKey;
}

export function getLemurParams(inputs: Inputs, editorData: LemurNodeData): LemurParams {
  const params: LemurParams = {
    transcript_ids: getTranscriptIds(inputs),
    context: coerceTypeOptional(inputs['context' as PortId], 'string') || editorData.context || undefined,
    final_model: editorData.final_model && editorData.final_model !== 'default' ? editorData.final_model : undefined,
    max_output_size: editorData.max_output_size,
  };

  return params;
}

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
    ]
  },
  {
    type: 'number',
    label: 'Maximum Output Size',
    dataKey: 'max_output_size'
  },
] as const;

export type FinalModel = 'default' | 'basic';

export type LemurParams = {
  transcript_ids: string[];
  context?: string;
  final_model?: FinalModel;
  max_output_size?: number;
}

export type LemurNodeData = {
  context?: string;
  final_model?: FinalModel;
  max_output_size?: number;
}