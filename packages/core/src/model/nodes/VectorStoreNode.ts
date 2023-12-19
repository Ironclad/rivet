import {
  type ChartNode,
  type NodeId,
  type NodeInputDefinition,
  type PortId,
  type NodeOutputDefinition,
} from '../NodeBase.js';
import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import { nodeDefinition } from '../NodeDefinition.js';
import { nanoid } from 'nanoid/non-secure';
import { type Inputs, type Outputs } from '../GraphProcessor.js';
import { type InternalProcessContext } from '../ProcessContext.js';
import { type EditorDefinition, type VectorDataValue } from '../../index.js';
import { dedent } from 'ts-dedent';
import { coerceTypeOptional } from '../../utils/coerceType.js';
import { getIntegration } from '../../integrations/integrations.js';

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
      Integration: ${this.data.useIntegrationInput ? '(using input)' : this.data.integration}
      Collection Id: ${this.data.useCollectionIdInput ? '(using input)' : this.data.collectionId}
    `;
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Takes in a vector, as well as data to store with the vector. This data is stored in the configured vector DB integration for later retrieval.
      `,
      infoBoxTitle: 'Vector Store Node',
      contextMenuTitle: 'Vector Store',
      group: ['Input/Output'],
    };
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const integration = this.data.useIntegrationInput
      ? coerceTypeOptional(inputs['integration' as PortId], 'string') ?? this.data.integration
      : this.data.integration;

    const vectorDb = getIntegration('vectorDatabase', integration, context);

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
