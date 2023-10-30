export interface Settings<PluginSettings = Record<string, Record<string, unknown>>> {
  recordingPlaybackLatency?: number;

  /** Configurable settings that a plugin can get and set. Settings can be available in the settings modal and are stored  */
  pluginSettings?: PluginSettings;

  /** A plugin can request environment variables to configure itself. Those can be populated here. */
  pluginEnv?: {
    [key: string]: string | undefined;
  };

  // TODO move to openai plugin
  openAiKey?: string;
  openAiOrganization?: string;
  openAiEndpoint?: string;

  /** Timeout in milliseconds before retrying a chat node call. */
  chatNodeTimeout?: number;

  chatNodeHeaders?: Record<string, string>;
}
