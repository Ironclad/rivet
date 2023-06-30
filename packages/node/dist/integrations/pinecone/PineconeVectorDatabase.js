"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PineconeVectorDatabase = void 0;
const node_crypto_1 = require("node:crypto");
const core_1 = require("../../core");
class PineconeVectorDatabase {
    #apiKey;
    constructor(settings) {
        this.#apiKey = settings.pineconeApiKey;
    }
    async store(collection, vector, data, { id }) {
        const [indexId, namespace] = (0, core_1.coerceType)(collection, 'string').split('/');
        const host = `https://${indexId}`;
        if (!id) {
            id = (0, node_crypto_1.createHash)('sha256').update(vector.value.join(',')).digest('hex');
        }
        const response = await fetch(`${host}/vectors/upsert`, {
            method: 'POST',
            body: JSON.stringify({
                vectors: [
                    {
                        id,
                        values: vector.value,
                        metadata: {
                            data: data.value,
                        },
                    },
                ],
                namespace,
            }),
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'api-key': this.#apiKey,
            },
        });
        if (response.status !== 200) {
            throw new Error(`Pinecone error: ${await response.text()}`);
        }
    }
    async nearestNeighbors(collection, vector, k) {
        const [indexId, namespace] = (0, core_1.coerceType)(collection, 'string').split('/');
        const host = `https://${indexId}`;
        const response = await fetch(`${host}/query`, {
            method: 'POST',
            body: JSON.stringify({
                vector: vector.value,
                topK: k,
                namespace,
                includeMetadata: true,
            }),
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'api-key': this.#apiKey,
            },
        });
        if (response.status !== 200) {
            throw new Error(`Pinecone error: ${await response.text()}`);
        }
        const responseData = await response.json();
        const { matches } = responseData;
        return {
            type: 'object[]',
            value: matches.map(({ id, metadata }) => ({ id, data: metadata.data })),
        };
    }
}
exports.PineconeVectorDatabase = PineconeVectorDatabase;
