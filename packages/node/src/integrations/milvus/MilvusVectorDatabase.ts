import {
  ArrayDataValue,
  DataValue,
  ScalarDataValue,
  VectorDataValue,
  VectorDatabase,
  coerceType,
} from '@ironclad/rivet-core';

import { MilvusClient } from '@zilliz/milvus2-sdk-node';

export class MilvusVectorDatabase implements VectorDatabase {
  #client: MilvusClient;

  constructor(
    options: {
      address?: string;
      ssl?: boolean;
      username?: string;
      password?: string;
    } = {},
  ) {
    const { address = '127.0.0.1:19530', ssl = false, username, password } = options;

    this.#client = new MilvusClient({
      address,
      ssl,
      username,
      password,
    });
  }

  async store(collection: DataValue, vector: VectorDataValue, data: DataValue): Promise<void> {
    const collectionName = coerceType(collection, 'string');

    const dataObj = data.type === 'string' ? { data: data.value } : coerceType(data, 'object');

    await this.#client.insert({
      collection_name: collectionName,
      fields_data: [dataObj],
    });
  }

  async nearestNeighbors(
    collection: DataValue,
    vector: VectorDataValue,
    k: number,
  ): Promise<ArrayDataValue<ScalarDataValue>> {
    const collectionName = coerceType(collection, 'string');

    await this.#client.loadCollection({
      collection_name: collectionName,
    });

    const results = await this.#client.search({
      collection_name: collectionName,
    });

    return {
      type: 'object[]',
      value: [],
    };
  }
}
