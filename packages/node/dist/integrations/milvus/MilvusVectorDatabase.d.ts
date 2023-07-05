import { ArrayDataValue, DataValue, ScalarDataValue, VectorDataValue, VectorDatabase } from '@ironclad/rivet-core';
export declare class MilvusVectorDatabase implements VectorDatabase {
    #private;
    constructor(options?: {
        address?: string;
        ssl?: boolean;
        username?: string;
        password?: string;
    });
    store(collection: DataValue, vector: VectorDataValue, data: DataValue): Promise<void>;
    nearestNeighbors(collection: DataValue, vector: VectorDataValue, k: number): Promise<ArrayDataValue<ScalarDataValue>>;
}
