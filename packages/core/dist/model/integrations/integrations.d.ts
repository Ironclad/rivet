import { InternalProcessContext } from '../ProcessContext';
import { EmbeddingGenerator } from './EmbeddingGenerator';
import { LLMProvider } from './LLMProvider';
import { VectorDatabase } from './VectorDatabase';
export type IntegrationFactories = {
    vectorDatabase: (context: InternalProcessContext) => VectorDatabase;
    llmProvider: (context: InternalProcessContext) => LLMProvider;
    embeddingGenerator: (context: InternalProcessContext) => EmbeddingGenerator;
};
export type IntegrationType = keyof IntegrationFactories;
export declare function registerIntegration<T extends IntegrationType>(type: T, integrationKey: string, factory: IntegrationFactories[T]): void;
export declare function getIntegration<T extends IntegrationType>(type: T, integrationKey: string, context: InternalProcessContext): ReturnType<IntegrationFactories[T]>;
