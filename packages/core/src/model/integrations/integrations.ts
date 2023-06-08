import { ArrayDataValue, DataValue, ScalarDataValue, VectorDataValue } from '../DataValue';
import { InternalProcessContext } from '../ProcessContext';

export interface VectorDatabase {
  store(collection: DataValue, vector: VectorDataValue, data: DataValue): Promise<void>;

  nearestNeighbors(collection: DataValue, vector: VectorDataValue, k: number): Promise<ArrayDataValue<ScalarDataValue>>;
}

export type IntegrationFactories = {
  vectorDatabase: (context: InternalProcessContext) => VectorDatabase;
};

export type IntegrationType = keyof IntegrationFactories;

const registeredIntegrations: {
  [P in IntegrationType]: Map<string, IntegrationFactories[P]>;
} = {
  vectorDatabase: new Map<string, (context: InternalProcessContext) => VectorDatabase>(),
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
