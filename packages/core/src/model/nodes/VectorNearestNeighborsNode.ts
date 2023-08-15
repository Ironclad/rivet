import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase.js';
import { NodeImpl, NodeUIData, nodeDefinition } from '../NodeImpl.js';
import { nanoid } from 'nanoid';
import { Inputs, Outputs } from '../GraphProcessor.js';
import { InternalProcessContext } from '../ProcessContext.js';
import { DataValue, EditorDefinition, VectorDataValue, coerceTypeOptional, getIntegration } from '../../index.js';
import { dedent } from 'ts-dedent';

export type VectorNearestNeighborsNode = ChartNode<'vectorNearestNeighbors', VectorNearestNeighborsNodeData>;

export type VectorNearestNeighborsNodeData = {
  integration: string;
  useIntegrationInput?: boolean;

  k: number;
  useKInput?: boolean;

  collectionId: string;
  useCollectionIdInput?: boolean;
};

export class VectorNearestNeighborsNodeImpl extends NodeImpl<VectorNearestNeighborsNode> {
  static create(): VectorNearestNeighborsNode {
    return {
      id: nanoid() as NodeId,
      type: 'vectorNearestNeighbors',
      title: 'Vector KNN',
      visualData: { x: 0, y: 0, width: 200 },
      data: {
        k: 10,
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

    if (this.data.useIntegrationInput) {
      inputDefinitions.push({
        id: 'integration' as PortId,
        title: 'Integration',
        dataType: 'string',
        required: true,
      });
    }

    if (this.data.useCollectionIdInput) {
      inputDefinitions.push({
        id: 'collectionId' as PortId,
        title: 'Collection ID',
        dataType: 'string',
        required: true,
      });
    }

    if (this.data.useKInput) {
      inputDefinitions.push({
        id: 'k' as PortId,
        title: 'K',
        dataType: 'number',
        required: true,
      });
    }

    if (this.data.useCollectionIdInput) {
      inputDefinitions.push({
        id: 'collectionId' as PortId,
        title: 'Collection ID',
        dataType: 'string',
        required: true,
      });
    }

    return inputDefinitions;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    const outputs: NodeOutputDefinition[] = [
      {
        id: 'results' as PortId,
        title: 'Results',
        dataType: 'any[]',
      },
    ];

    return outputs;
  }

  getEditors(): EditorDefinition<VectorNearestNeighborsNode>[] {
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
        type: 'number',
        label: 'K',
        dataKey: 'k',
        min: 1,
        max: 100,
        step: 1,
        defaultValue: 10,
        useInputToggleDataKey: 'useKInput',
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
      k: ${this.data.useKInput ? '(using input)' : this.data.k}
      ${this.data.useCollectionIdInput ? '(using input)' : this.data.collectionId}
    `;
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Performs a k-nearest neighbors search on the vectors stored in the configured vector DB integration. Takes in a vector and returns the k closest vectors and their corresponding data.
      `,
      infoBoxTitle: 'Vector KNN Node',
      contextMenuTitle: 'Vector KNN',
      group: ['Input/Output'],
    };
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const integration = this.data.useIntegrationInput
      ? coerceTypeOptional(inputs['integration' as PortId], 'string') ?? this.data.integration
      : this.data.integration;
    const vectorDb = getIntegration('vectorDatabase', integration, context);

    const k = this.data.useKInput ? coerceTypeOptional(inputs['k' as PortId], 'number') ?? this.data.k : this.data.k;

    if (inputs['vector' as PortId]?.type !== 'vector') {
      throw new Error(`Expected vector input, got ${inputs['vector' as PortId]?.type}`);
    }

    const results = await vectorDb.nearestNeighbors(
      { type: 'string', value: this.data.collectionId },
      inputs['vector' as PortId] as VectorDataValue,
      k,
    );

    return {
      ['results' as PortId]: results as DataValue,
    };
  }
}

export const vectorNearestNeighborsNode = nodeDefinition(VectorNearestNeighborsNodeImpl, 'Vector KNN');
