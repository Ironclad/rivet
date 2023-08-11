import anthropicPlugin from './plugins/anthropic/index.js';
import autoevalsPlugin from './plugins/autoevals/index.js';

export { anthropicPlugin, autoevalsPlugin };

export const plugins = {
  anthropic: anthropicPlugin,
  autoevals: autoevalsPlugin,
};
