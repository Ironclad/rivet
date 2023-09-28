import { type InternalProcessContext } from '../model/ProcessContext.js';
import { type EmbeddingGenerator } from './EmbeddingGenerator.js';
import { type LLMProvider } from './LLMProvider.js';
import { type VectorDatabase } from './VectorDatabase.js';

export type IntegrationFactories = {
  vectorDatabase: (context: InternalProcessContext) => VectorDatabase;
  llmProvider: (context: InternalProcessContext) => LLMProvider;
  embeddingGenerator: (context: InternalProcessContext) => EmbeddingGenerator;
};

export type IntegrationType = keyof IntegrationFactories;

const registeredIntegrations: {
  [P in IntegrationType]: Map<string, IntegrationFactories[P]>;
} = {
  vectorDatabase: new Map<string, (context: InternalProcessContext) => VectorDatabase>(),
  llmProvider: new Map<string, (context: InternalProcessContext) => LLMProvider>(),
  embeddingGenerator: new Map<string, (context: InternalProcessContext) => EmbeddingGenerator>(),
};

export function registerIntegration<T extends IntegrationType>(
  type: T,
  integrationKey: string,
  factory: IntegrationFactories[T],
): void {
  registeredIntegrations[type].set(integrationKey, factory);
}

export function getIntegration<T extends IntegrationType>(
  type: T,
  integrationKey: string,
  context: InternalProcessContext,
): ReturnType<IntegrationFactories[T]> {
  const factory = registeredIntegrations[type].get(integrationKey);
  if (!factory) {
    throw new Error(`Integration ${integrationKey} not found`);
  }
  return factory(context) as ReturnType<IntegrationFactories[T]>;
}
