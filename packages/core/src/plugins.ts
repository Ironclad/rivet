import anthropicPlugin from './plugins/anthropic/index.js';
import autoevalsPlugin from './plugins/autoevals/index.js';
import assemblyAiPlugin from './plugins/assemblyAi/index.js';
import { braintrustPlugin } from './plugins/braintrust/plugin.js';

export { anthropicPlugin, autoevalsPlugin, assemblyAiPlugin, braintrustPlugin };

export const plugins = {
  anthropic: anthropicPlugin,
  autoevals: autoevalsPlugin,
  assemblyAi: assemblyAiPlugin,
  braintrust: braintrustPlugin,
};

export type BuiltInPluginID = keyof typeof plugins;
