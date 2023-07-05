const registeredIntegrations = {
    vectorDatabase: new Map(),
    llmProvider: new Map(),
    embeddingGenerator: new Map(),
};
export function registerIntegration(type, integrationKey, factory) {
    registeredIntegrations[type].set(integrationKey, factory);
}
export function getIntegration(type, integrationKey, context) {
    const factory = registeredIntegrations[type].get(integrationKey);
    if (!factory) {
        throw new Error(`Integration ${integrationKey} not found`);
    }
    return factory(context);
}
