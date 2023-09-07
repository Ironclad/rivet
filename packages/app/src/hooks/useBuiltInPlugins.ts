import { orderBy } from 'lodash-es';

const builtInPlugins = orderBy(
  [
    {
      label: 'Anthropic',
      value: 'anthropic',
    },
    {
      label: 'AssemblyAI',
      value: 'assemblyAi',
    },
    {
      label: 'Autoevals',
      value: 'autoevals',
    },
  ] as const,
  'label',
);

export function useBuiltInPlugins() {
  return builtInPlugins;
}
