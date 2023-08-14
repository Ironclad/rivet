import anthropicPlugin from './plugins/anthropic/index.js';
import autoevalsPlugin from './plugins/autoevals/index.js';
import assemblyAiPlugin from './plugins/assemblyAi/index.js';

export { anthropicPlugin, autoevalsPlugin, assemblyAiPlugin };

export const plugins = {
  anthropic: anthropicPlugin,
  autoevals: autoevalsPlugin,
  assemblyAi: assemblyAiPlugin,
};
