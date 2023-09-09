import {
  ArrayDataValue,
  DataValue,
  ScalarDataValue,
  Settings,
  VectorDataValue,
  VectorDatabase,
  coerceType,
} from '@ironclad/rivet-core';

async function sha256(message: string): Promise<string> {
  // encode as UTF-8
  const msgBuffer = new TextEncoder().encode(message);

  // hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

  // convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // convert bytes to hex string
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export class PineconeVectorDatabase implements VectorDatabase {
  #apiKey;

  constructor(settings: Settings) {
    this.#apiKey = settings.pluginSettings?.pinecone?.apiKey as string | undefined;
  }

  async store(collection: DataValue, vector: VectorDataValue, data: DataValue, { id }: { id?: string }): Promise<void> {
    const [indexId, namespace] = coerceType(collection, 'string').split('/');

    const host = `https://${indexId}`;

    if (!id) {
      id = await sha256(vector.value.join(','));
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
      value: matches.map(({ id, metadata }) => ({ id, data: metadata.data })),
    };
  }
}
