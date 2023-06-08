import { registerIntegration } from '../core';
import { MilvusVectorDatabase } from './milvus/MilvusVectorDatabase';
import { PineconeVectorDatabase } from './pinecone/PineconeVectorDatabase';

registerIntegration('vectorDatabase', 'pinecone', (context) => new PineconeVectorDatabase(context.settings));
registerIntegration('vectorDatabase', 'milvus', () => new MilvusVectorDatabase());
