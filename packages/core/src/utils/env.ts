import { NodeRegistration, StringPluginConfigurationSpec, globalRivetNodeRegistry } from '../index.js';

export function getPluginEnvFromProcessEnv(env: Record<string, string | undefined>, registry?: NodeRegistration) {
  const pluginEnv: Record<string, string> = {};
  for (const plugin of (registry ?? globalRivetNodeRegistry).getPlugins() ?? []) {
    const configs = Object.entries(plugin.configSpec ?? {}).filter(([, c]) => c.type === 'string') as [
      string,
      StringPluginConfigurationSpec,
    ][];
    for (const [configName, config] of configs) {
      if (config.pullEnvironmentVariable) {
        const envVarName =
          typeof config.pullEnvironmentVariable === 'string'
            ? config.pullEnvironmentVariable
            : config.pullEnvironmentVariable === true
            ? configName
            : undefined;
        if (envVarName) {
          pluginEnv[envVarName] = env[envVarName] ?? '';
        }
      }
    }
  }
  return pluginEnv;
}
