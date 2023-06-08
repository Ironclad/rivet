import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl, nodeDefinition } from '../NodeImpl';
import { nanoid } from 'nanoid';
import { Inputs, Outputs } from '../GraphProcessor';
import { InternalProcessContext } from '../ProcessContext';
import { VectorDataValue, getIntegration } from '../..';

export type VectorStoreNode = ChartNode<'vectorStore', VectorStoreNodeData>;

export type VectorStoreNodeData = {
  integration: string;
  collectionId: string;
};

export class VectorStoreNodeImpl extends NodeImpl<VectorStoreNode> {
  static create(): VectorStoreNode {
    return {
      id: nanoid() as NodeId,
      type: 'vectorStore',
      title: 'Vector Store',
      visualData: { x: 0, y: 0, width: 200 },
      data: {
        integration: 'pinecone',
        collectionId: '',
      },
    };
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputDefinitions: NodeInputDefinition[] = [];

    inputDefinitions.push({
      id: 'vector' as PortId,
      title: 'Vector',
      dataType: 'vector',
      required: true,
    });

    inputDefinitions.push({
      id: 'data' as PortId,
      title: 'Data',
      dataType: 'any',
      required: true,
    });

    return inputDefinitions;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    const outputs: NodeOutputDefinition[] = [
      {
        id: 'complete' as PortId,
        title: 'Complete',
        dataType: 'boolean',
      },
    ];

    return outputs;
  }

  getEditors(): EditorDefinition<VectorStoreNode>[] {
    return [
      {
        type: 'dropdown',
        label: 'Integration',
        dataKey: 'integration',
        options: [
          { label: 'Pinecone', value: 'pinecone' },
          { label: 'Milvus', value: 'milvus' },
        ],
      },
      {
        type: 'string',
        label: 'Collection ID',
        dataKey: 'collectionId',
      },
    ];
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const vectorDb = getIntegration('vectorDatabase', this.data.integration, context);

    if (inputs['vector' as PortId]?.type !== 'vector') {
      throw new Error(`Expected vector input, got ${inputs['vector' as PortId]?.type}`);
    }

    await vectorDb.store(
      { type: 'string', value: this.data.collectionId },
      inputs['vector' as PortId] as VectorDataValue,
      inputs['data' as PortId]!,
    );

    return {
      ['complete' as PortId]: {
        type: 'boolean',
        value: true,
      },
    };
  }
}

export const vectorStoreNode = nodeDefinition(VectorStoreNodeImpl, 'Vector Store');
