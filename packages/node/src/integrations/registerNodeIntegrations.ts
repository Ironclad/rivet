import { registerIntegration } from '@ironclad/rivet-core';
import { MilvusVectorDatabase } from './milvus/MilvusVectorDatabase.js';
import { PineconeVectorDatabase } from './pinecone/PineconeVectorDatabase.js';

registerIntegration('vectorDatabase', 'pinecone', (context) => new PineconeVectorDatabase(context.settings));
registerIntegration('vectorDatabase', 'milvus', () => new MilvusVectorDatabase());
