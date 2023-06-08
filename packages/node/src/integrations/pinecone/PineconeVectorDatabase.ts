import { createHash } from 'node:crypto';
import {
  ArrayDataValue,
  DataValue,
  ScalarDataValue,
  Settings,
  VectorDataValue,
  VectorDatabase,
  coerceType,
} from '../../core';
import { nanoid } from 'nanoid';

export class PineconeVectorDatabase implements VectorDatabase {
  #apiKey;

  constructor(settings: Settings) {
    this.#apiKey = settings.pineconeApiKey;
  }

  async store(collection: DataValue, vector: VectorDataValue, data: DataValue, { id }: { id?: string }): Promise<void> {
    const [indexId, namespace] = coerceType(collection, 'string').split('/');

    const host = `https://${indexId}.svc.us-central1-gcp.pinecone.io`;

    if (!id) {
      id = createHash('sha256').update(vector.value.join(',')).digest('hex');
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
        'api-key': this.#apiKey!,
      },
    });

    if (response.status !== 200) {
      throw new Error(`Pinecone error: ${await response.text()}`);
    }
  }

  async nearestNeighbors(
    collection: DataValue,
    vector: VectorDataValue,
    k: number,
  ): Promise<ArrayDataValue<ScalarDataValue>> {
    const [indexId, namespace] = coerceType(collection, 'string').split('/');

    const host = `https://${indexId}.svc.us-central1-gcp.pinecone.io`;

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
        'api-key': this.#apiKey!,
      },
    });

    if (response.status !== 200) {
      throw new Error(`Pinecone error: ${await response.text()}`);
    }

    const responseData = await response.json();

    const { matches } = responseData as {
      matches: {
        id: string;
        score: number;
        metadata: { data: unknown };
      }[];
    };

    return {
      type: 'object[]',
      value: matches.map(({ metadata }) => metadata.data),
    };
  }
}
