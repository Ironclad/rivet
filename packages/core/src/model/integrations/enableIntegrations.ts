import { registerIntegration } from './integrations';
import { OpenAIEmbeddingGenerator } from './openai/OpenAIEmbeddingGenerator';

registerIntegration('embeddingGenerator', 'openai', (context) => new OpenAIEmbeddingGenerator(context.settings));
