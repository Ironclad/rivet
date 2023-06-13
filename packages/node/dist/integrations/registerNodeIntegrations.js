"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("../core");
const MilvusVectorDatabase_1 = require("./milvus/MilvusVectorDatabase");
const PineconeVectorDatabase_1 = require("./pinecone/PineconeVectorDatabase");
(0, core_1.registerIntegration)('vectorDatabase', 'pinecone', (context) => new PineconeVectorDatabase_1.PineconeVectorDatabase(context.settings));
(0, core_1.registerIntegration)('vectorDatabase', 'milvus', () => new MilvusVectorDatabase_1.MilvusVectorDatabase());
