import { plugins } from '@ironclad/rivet-core';
import { orderBy } from 'lodash-es';

const pluginOptions = orderBy(
  Object.entries(plugins).map(([id, plugin]) => ({
    value: id,
    label: plugin.name ?? plugin.id,
  })),
  'label',
);

export function useBuiltInPlugins() {
  return pluginOptions;
}
