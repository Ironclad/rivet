export const modelSelectorOptions = [
  { label: 'Local Model', value: 'openai:local-model' },
  { label: 'OpenAI: GPT-4.1', value: 'openai:gpt-4.1' },
  { label: 'OpenAI: GPT-4.1 Mini', value: 'openai:gpt-4.1-mini' },
  { label: 'OpenAI: o4-mini', value: 'openai:o4-mini' },
  { label: 'Anthropic: Claude Sonnet 4', value: 'anthropic:claude-sonnet-4-20250514' },
  { label: 'Anthropic: Claude Opus 4', value: 'anthropic:claude-opus-4-20250514' },
  { label: 'Anthropic: Claude 3.7 Sonnet', value: 'anthropic:claude-3-7-sonnet-latest' },
] as const;

export type ModelSelectorValue = (typeof modelSelectorOptions)[number]['value'];

export const defaultModelSelectorOption = modelSelectorOptions[4]; // Default to Claude Sonnet 4

export const defaultModelSelectorValue = defaultModelSelectorOption.value;
