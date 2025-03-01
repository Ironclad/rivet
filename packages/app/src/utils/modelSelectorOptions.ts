export const modelSelectorOptions = [
  { label: 'Local Model', value: 'openai:local-model' },
  { label: 'OpenAI: GPT-4o', value: 'openai:gpt-4o' },
  { label: 'OpenAI: GPT-4o mini', value: 'openai:gpt-4o-mini' },
  { label: 'OpenAI: o3-mini', value: 'openai:o3-mini' },
  { label: 'Anthropic: Claude 3.7 Sonnet', value: 'anthropic:claude-3-7-sonnet-latest' },
  { label: 'Anthropic: Claude 3.5 Sonnet', value: 'anthropic:claude-3-5-sonnet-latest' },
] as const;

export type ModelSelectorValue = (typeof modelSelectorOptions)[number]['value'];

export const defaultModelSelectorOption = modelSelectorOptions[0];

export const defaultModelSelectorValue = defaultModelSelectorOption.value;
