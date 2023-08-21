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
    label: 'AssemblyAI',
    value: 'assemblyAi',
  },
] as const;

export function useBuiltInPlugins() {
  return builtInPlugins;
}
