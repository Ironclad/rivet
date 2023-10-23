import { type Settings } from '../../index.js';
import { type EmbeddingGenerator } from '../EmbeddingGenerator.js';
import { OpenAI } from 'openai';

export class OpenAIEmbeddingGenerator implements EmbeddingGenerator {
  readonly #settings;

  constructor(settings: Settings) {
    this.#settings = settings;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const api = new OpenAI({
      apiKey: this.#settings.openAiKey,
      organization: this.#settings.openAiOrganization,
      dangerouslyAllowBrowser: true, // It's fine in Rivet
    });

    const response = await api.embeddings.create({
      input: text,
      model: 'text-embedding-ada-002',
    });

    const embeddings = response.data;

    return embeddings[0]!.embedding;
  }
}
