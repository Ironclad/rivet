import anthropicPlugin from './plugins/anthropic/index.js';
import autoevalsPlugin from './plugins/autoevals/index.js';
import assemblyAiPlugin from './plugins/assemblyAi/index.js';
import { huggingFacePlugin } from './plugins/huggingface/plugin.js';

export { anthropicPlugin, autoevalsPlugin, assemblyAiPlugin, huggingFacePlugin };

export const plugins = {
  anthropic: anthropicPlugin,
  autoevals: autoevalsPlugin,
  assemblyAi: assemblyAiPlugin,
  huggingFace: huggingFacePlugin,
};
