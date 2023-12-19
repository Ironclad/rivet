import anthropicPlugin from './plugins/anthropic/index.js';
import autoevalsPlugin from './plugins/autoevals/index.js';
import assemblyAiPlugin from './plugins/assemblyAi/index.js';
import { huggingFacePlugin } from './plugins/huggingface/plugin.js';
import pineconePlugin from './plugins/pinecone/index.js';
import gentracePlugin from './plugins/gentrace/index.js';
import { openAIPlugin } from './plugins/openai/plugin.js';
import { googlePlugin } from './plugins/google/plugin.js';

export { anthropicPlugin, autoevalsPlugin, assemblyAiPlugin, pineconePlugin, huggingFacePlugin, gentracePlugin, googlePlugin };

export const plugins = {
  anthropic: anthropicPlugin,
  autoevals: autoevalsPlugin,
  assemblyAi: assemblyAiPlugin,
  pinecone: pineconePlugin,
  huggingFace: huggingFacePlugin,
  gentrace: gentracePlugin,
  openai: openAIPlugin,
  google: googlePlugin
};
