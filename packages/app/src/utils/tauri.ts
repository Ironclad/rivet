import { RivetPlugin, Settings, StringPluginConfigurationSpec } from '@ironclad/rivet-core';
import { window } from '@tauri-apps/api';
import { invoke } from '@tauri-apps/api/tauri';
import { entries, values } from '../../../core/src/utils/typeSafety';

export function isInTauri(): boolean {
  try {
    window.getCurrent();
    return true;
  } catch (err) {
    return false;
  }
}

export async function getEnvVar(name: string): Promise<string | undefined> {
  if (isInTauri()) {
    return await invoke('get_environment_variable', { name });
  } else {
    return process.env[name];
  }
}

export async function fillMissingSettingsFromEnvironmentVariables(settings: Partial<Settings>, plugins: RivetPlugin[]) {
  const fullSettings: Settings = {
    openAiKey: (settings.openAiKey || (await getEnvVar('OPENAI_API_KEY'))) ?? '',
    openAiOrganization: (settings.openAiOrganization || (await getEnvVar('OPENAI_ORG_ID'))) ?? '',
    pluginSettings: settings.pluginSettings,
    pluginEnv: {},
  };

  for (const plugin of plugins) {
    const stringConfigs = entries(plugin.configSpec ?? {}).filter(([, c]) => c.type === 'string') as [
      string,
      StringPluginConfigurationSpec,
    ][];
    for (const [configName, config] of stringConfigs) {
      if (config.pullEnvironmentVariable) {
        const envVarName =
          typeof config.pullEnvironmentVariable === 'string'
            ? config.pullEnvironmentVariable
            : config.pullEnvironmentVariable === true
            ? configName
            : undefined;
        if (envVarName) {
          const envVarValue = await getEnvVar(envVarName);
          if (envVarValue) {
            fullSettings.pluginEnv![envVarName] = envVarValue;
          }
        }
      }
    }
  }

  return fullSettings;
}
