const builtInPlugins = [
  {
    label: 'Anthropic',
    value: 'anthropic',
  },
  {
    label: 'Autoevals',
    value: 'autoevals',
  },
  {
    label: 'Assembly AI',
    value: 'assemblyAi',
  },
] as const;

export function useBuiltInPlugins() {
  return builtInPlugins;
}
