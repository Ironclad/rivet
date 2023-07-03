"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MilvusVectorDatabase = void 0;
const rivet_core_1 = require("@ironclad/rivet-core");
const milvus2_sdk_node_1 = require("@zilliz/milvus2-sdk-node");
class MilvusVectorDatabase {
    #client;
    constructor(options = {}) {
        const { address = '127.0.0.1:19530', ssl = false, username, password } = options;
        this.#client = new milvus2_sdk_node_1.MilvusClient({
            address,
            ssl,
            username,
            password,
        });
    }
    async store(collection, vector, data) {
        const collectionName = (0, rivet_core_1.coerceType)(collection, 'string');
        const dataObj = data.type === 'string' ? { data: data.value } : (0, rivet_core_1.coerceType)(data, 'object');
        await this.#client.insert({
            collection_name: collectionName,
            fields_data: [dataObj],
        });
    }
    async nearestNeighbors(collection, vector, k) {
        const collectionName = (0, rivet_core_1.coerceType)(collection, 'string');
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
exports.MilvusVectorDatabase = MilvusVectorDatabase;
