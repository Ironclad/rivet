import type {
  ChartNode,
  DatasetId,
  Inputs,
  InternalProcessContext,
  NodeId,
  NodeInputDefinition,
  NodeOutputDefinition,
  NodeUIData,
  Outputs,
  PortId,
  EditorDefinition,
} from '../../index.js';
import { NodeImpl } from '../NodeImpl.js';
import { coerceType, dedent, getInputOrData, newId } from '../../utils/index.js';
import { nodeDefinition } from '../NodeDefinition.js';

export type DatasetNearestNeighborsNode = ChartNode<'datasetNearestNeighbors', DatasetNearestNeighborsNodeData>;

type DatasetNearestNeighborsNodeData = {
  datasetId: DatasetId;
  useDatasetIdInput?: boolean;

  k: number;
  useKInput?: boolean;
};

export class DatasetNearestNeighborsNodeImpl extends NodeImpl<DatasetNearestNeighborsNode> {
  static create(): DatasetNearestNeighborsNode {
    return {
      id: newId<NodeId>(),
      type: 'datasetNearestNeighbors',
      title: 'KNN Dataset',
      visualData: { x: 0, y: 0, width: 250 },
      data: {
        datasetId: '' as DatasetId,
        k: 5,
      },
    };
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [
      {
        id: 'embedding' as PortId,
        title: 'Embedding',
        dataType: 'object',
      },
    ];

    if (this.data.useDatasetIdInput) {
      inputs.push({
        id: 'datasetId' as PortId,
        title: 'Dataset ID',
        dataType: 'string',
      });
    }

    if (this.data.useKInput) {
      inputs.push({
        id: 'k' as PortId,
        title: 'K',
        dataType: 'number',
      });
    }

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'nearestNeighbors' as PortId,
        title: 'Nearest Neighbors',
        dataType: 'object[]',
      },
    ];
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Finds the k nearest neighbors in the dataset with the provided ID, given an embedding.
      `,
      infoBoxTitle: 'KNN Dataset Node',
      contextMenuTitle: 'KNN Dataset',
      group: ['Input/Output'],
    };
  }

  getEditors(): EditorDefinition<DatasetNearestNeighborsNode>[] {
    return [
      {
        type: 'datasetSelector',
        label: 'Dataset',
        dataKey: 'datasetId',
        useInputToggleDataKey: 'useDatasetIdInput',
      },
      {
        type: 'number',
        label: 'K',
        dataKey: 'k',
        useInputToggleDataKey: 'useKInput',
      },
    ];
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const { datasetProvider } = context;

    if (datasetProvider == null) {
      throw new Error('datasetProvider is required');
    }

    const datasetId = getInputOrData(this.data, inputs, 'datasetId');
    const k = getInputOrData(this.data, inputs, 'k', 'number');
    const embedding = coerceType(inputs['embedding' as PortId], 'vector');

    const nearestNeighbors = await datasetProvider.knnDatasetRows(datasetId as DatasetId, k, embedding);

    return {
      ['nearestNeighbors' as PortId]: {
        type: 'object[]',
        value: nearestNeighbors.map((neighbor) => ({
          id: neighbor.id,
          distance: neighbor.distance,
          data: neighbor.data,
        })),
      },
    };
  }
}

export const datasetNearestNeighborsNode = nodeDefinition(DatasetNearestNeighborsNodeImpl, 'Dataset Nearest Neighbors');
