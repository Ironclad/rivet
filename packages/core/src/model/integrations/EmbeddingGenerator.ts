export interface EmbeddingGenerator {
  generateEmbedding(text: string): Promise<number[]>;
}
