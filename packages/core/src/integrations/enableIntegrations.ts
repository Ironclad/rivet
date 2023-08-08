import { registerIntegration } from './integrations.js';
import { OpenAIEmbeddingGenerator } from './openai/OpenAIEmbeddingGenerator.js';

registerIntegration('embeddingGenerator', 'openai', (context) => new OpenAIEmbeddingGenerator(context.settings));
