const builtInPlugins = [
  {
    label: 'Anthropic',
    value: 'anthropic',
  },
  {
    label: 'Autoevals',
    value: 'autoevals',
  },
] as const;

export function useBuiltInPlugins() {
  return builtInPlugins;
}
