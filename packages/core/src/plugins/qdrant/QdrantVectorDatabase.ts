import {
  type ArrayDataValue,
  type DataValue,
  type ScalarDataValue,
  type Settings,
  type VectorDataValue,
  type VectorDatabase,
} from '../../index.js';
import { coerceType } from '../../utils/coerceType.js';
import crypto from 'crypto';

export class QdrantVectorDatabase implements VectorDatabase {
  readonly #apiKey;
  readonly #qdrantUrl;

  constructor(settings: Settings) {
    this.#apiKey = settings.pluginSettings?.qdrant?.qdrantApiKey as string | undefined;
    this.#qdrantUrl = settings.pluginSettings?.qdrant?.qdrantUrl as string | undefined;
  }

  async store(collection: DataValue, vector: VectorDataValue, data: DataValue, { id }: { id?: string }): Promise<void> {
    const collectionName = coerceType(collection, 'string');

    if (!id) {
      id = crypto.randomUUID();
    }

    let payload: Record<string, unknown> = {};
    if (data.type === 'object') {
      payload = data.value;
    } else {
      payload = { data: data.value };
    }

    // Convert to URL to handle trailing slashes or any other URL inconsistencies
    const requestUrl = `${new URL(this.#qdrantUrl!).toString()}collections/${collectionName}/points`;
    const response = await fetch(requestUrl, {
      method: 'PUT',
      body: JSON.stringify({
        points: [
          {
            id,
            vector: vector.value,
            payload,
          },
        ],
      }),
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.#apiKey!,
      },
    });

    if (response.status !== 200) {
      throw new Error(`Qdrant error: ${await response.text()}`);
    }
    return;
  }

  async nearestNeighbors(
    collection: DataValue,
    vector: VectorDataValue,
    k: number,
  ): Promise<ArrayDataValue<ScalarDataValue>> {
    const collectionName = coerceType(collection, 'string');

    const requestUrl = `${new URL(this.#qdrantUrl!).toString()}collections/${collectionName}/points/search`;

    const response = await fetch(requestUrl, {
      method: 'POST',
      body: JSON.stringify({
        vector: vector.value,
        limit: k,
        with_payload: true,
      }),
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.#apiKey!,
      },
    });

    if (response.status !== 200) {
      throw new Error(`Qdrant error: ${await response.text()}`);
    }

    const responseData = await response.json();

    const { result } = responseData as {
      result: {
        id: string;
        score: number;
        payload: object;
      }[];
    };

    return {
      type: 'object[]',
      value: result.map(({ id, score, payload }) => ({ id, score, payload })),
    };
  }
}
