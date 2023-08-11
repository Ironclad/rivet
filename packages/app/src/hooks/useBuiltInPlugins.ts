const builtInPlugins = [
  {
    label: 'Anthropic',
    value: 'anthropic',
  },
] as const;

export function useBuiltInPlugins() {
  return builtInPlugins;
}
