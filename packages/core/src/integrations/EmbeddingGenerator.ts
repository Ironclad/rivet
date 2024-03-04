export interface EmbeddingGenerator {
  generateEmbedding(text: string, options?: Record<string, unknown>): Promise<number[]>;
}
