import { ArrayDataValue, DataValue, ScalarDataValue, Settings, VectorDataValue, VectorDatabase } from '../../core';
export declare class PineconeVectorDatabase implements VectorDatabase {
    #private;
    constructor(settings: Settings);
    store(collection: DataValue, vector: VectorDataValue, data: DataValue, { id }: {
        id?: string;
    }): Promise<void>;
    nearestNeighbors(collection: DataValue, vector: VectorDataValue, k: number): Promise<ArrayDataValue<ScalarDataValue>>;
}
