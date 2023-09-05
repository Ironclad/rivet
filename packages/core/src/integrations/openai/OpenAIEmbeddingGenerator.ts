import { Settings } from '../../index.js';
import { EmbeddingGenerator } from '../EmbeddingGenerator.js';
import * as openai from 'openai';

export class OpenAIEmbeddingGenerator implements EmbeddingGenerator {
  #settings;

  constructor(settings: Settings) {
    this.#settings = settings;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const config = new openai.Configuration({
      apiKey: this.#settings.openAiKey,
      organization: this.#settings.openAiOrganization,
    });

    const api = new openai.OpenAIApi(config);

    const response = await api.createEmbedding({
      input: text,
      model: 'text-embedding-ada-002',
    });

    const { embedding } = response.data.data[0]!;

    return embedding;
  }
}
