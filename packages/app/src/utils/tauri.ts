import { Settings } from '@ironclad/rivet-core';
import { window } from '@tauri-apps/api';
import { invoke } from '@tauri-apps/api/tauri';

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

export async function fillMissingSettingsFromEnvironmentVariables(settings: Partial<Settings>) {
  const fullSettings: Settings = {
    openAiKey: (settings.openAiKey || (await getEnvVar('OPENAI_API_KEY'))) ?? '',
    openAiOrganization: (settings.openAiOrganization || (await getEnvVar('OPENAI_ORG_ID'))) ?? '',
    pineconeApiKey: (settings.pineconeApiKey || (await getEnvVar('PINECONE_API_KEY'))) ?? '',
  };

  console.dir({ fullSettings });

  return fullSettings;
}
