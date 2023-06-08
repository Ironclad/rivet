import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl, nodeDefinition } from '../NodeImpl';
import { nanoid } from 'nanoid';
import { Inputs, Outputs } from '../GraphProcessor';
import { InternalProcessContext } from '../ProcessContext';
import { VectorDataValue, coerceTypeOptional, getIntegration } from '../..';
import dedent from 'ts-dedent';

export type VectorStoreNode = ChartNode<'vectorStore', VectorStoreNodeData>;

export type VectorStoreNodeData = {
  integration: string;
  useIntegrationInput?: boolean;

  collectionId: string;
  useCollectionIdInput?: boolean;
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

    if (this.data.useCollectionIdInput) {
      inputDefinitions.push({
        id: 'collectionId' as PortId,
        title: 'Collection ID',
        dataType: 'string',
        required: true,
      });
    }

    inputDefinitions.push({
      id: 'data' as PortId,
      title: 'Data',
      dataType: 'any',
      required: true,
    });

    if (this.data.useIntegrationInput) {
      inputDefinitions.push({
        id: 'integration' as PortId,
        title: 'Integration',
        dataType: 'string',
        required: true,
      });
    }

    inputDefinitions.push({
      id: 'id' as PortId,
      title: 'ID',
      dataType: 'string',
      required: false,
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
        useInputToggleDataKey: 'useIntegrationInput',
      },
      {
        type: 'string',
        label: 'Collection ID',
        dataKey: 'collectionId',
        useInputToggleDataKey: 'useCollectionIdInput',
      },
    ];
  }

  getBody(): string | undefined {
    return dedent`
      ${this.data.useIntegrationInput ? '(Integration using input)' : this.data.integration}
      ${this.data.useCollectionIdInput ? '(using input)' : this.data.collectionId}
    `;
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
      {
        id: coerceTypeOptional(inputs['id' as PortId], 'string'),
      },
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
