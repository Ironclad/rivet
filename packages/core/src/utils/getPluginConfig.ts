import type { RivetPlugin, Settings, StringPluginConfigurationSpec } from '../index.js';

export function getPluginConfig(plugin: RivetPlugin | undefined, settings: Settings, name: string) {
  if (!plugin) {
    return undefined;
  }

  const configSpec = plugin?.configSpec?.[name];

  if (!configSpec) {
    return undefined;
  }

  const pluginSettings = settings.pluginSettings?.[plugin.id];
  if (pluginSettings) {
    const value = pluginSettings[name];
    if (!value || typeof value !== 'string') {
      return undefined;
    }

    return value;
  }

  const envFallback = (configSpec as StringPluginConfigurationSpec).pullEnvironmentVariable;
  const envFallbackName = envFallback === true ? name : envFallback;

  if (envFallbackName && settings.pluginEnv?.[envFallbackName]) {
    return settings.pluginEnv[envFallbackName];
  }

  return undefined;
}
