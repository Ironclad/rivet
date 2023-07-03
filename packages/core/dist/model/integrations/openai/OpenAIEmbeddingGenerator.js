import * as openai from 'openai';
export class OpenAIEmbeddingGenerator {
    #settings;
    constructor(settings) {
        this.#settings = settings;
    }
    async generateEmbedding(text) {
        const config = new openai.Configuration({
            apiKey: this.#settings.openAiKey,
            organization: this.#settings.openAiOrganization,
        });
        const api = new openai.OpenAIApi(config);
        const response = await api.createEmbedding({
            input: text,
            model: 'text-embedding-ada-002',
        });
        const { embedding } = response.data.data[0];
        return embedding;
    }
}
