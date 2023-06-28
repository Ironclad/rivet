import { Settings } from '../../NodeImpl';
import { EmbeddingGenerator } from '../EmbeddingGenerator';
export declare class OpenAIEmbeddingGenerator implements EmbeddingGenerator {
    #private;
    constructor(settings: Settings);
    generateEmbedding(text: string): Promise<number[]>;
}
