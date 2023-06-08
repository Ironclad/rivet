import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl, nodeDefinition } from '../NodeImpl';
import { nanoid } from 'nanoid';
import { Inputs, Outputs } from '../GraphProcessor';
import { InternalProcessContext } from '../ProcessContext';
import { DataValue, VectorDataValue, getIntegration } from '../..';

export type VectorNearestNeighborsNode = ChartNode<'vectorNearestNeighbors', VectorNearestNeighborsNodeData>;

export type VectorNearestNeighborsNodeData = {
  k: number;
  integration: string;
  collectionId: string;
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
      },
      {
        type: 'number',
        label: 'K',
        dataKey: 'k',
        min: 1,
        max: 100,
        step: 1,
        defaultValue: 10,
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

    console.dir({ collectionId: this.data.collectionId });
    const results = await vectorDb.nearestNeighbors(
      { type: 'string', value: this.data.collectionId },
      inputs['vector' as PortId] as VectorDataValue,
      this.data.k,
    );

    return {
      ['results' as PortId]: results as DataValue,
    };
  }
}

export const vectorNearestNeighborsNode = nodeDefinition(VectorNearestNeighborsNodeImpl, 'Vector KNN');
