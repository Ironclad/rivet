import { type DataValue, type VectorDataValue, type ArrayDataValue, type ScalarDataValue } from '../model/DataValue.js';

export interface VectorDatabase {
  store(collection: DataValue, vector: VectorDataValue, data: DataValue, metadata: { id?: string }): Promise<void>;

  nearestNeighbors(collection: DataValue, vector: VectorDataValue, k: number): Promise<ArrayDataValue<ScalarDataValue>>;
}
