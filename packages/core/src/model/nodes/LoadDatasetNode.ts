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
import { coerceTypeOptional, dedent, newId } from '../../utils/index.js';
import { nodeDefinition } from '../NodeDefinition.js';

export type LoadDatasetNode = ChartNode<'loadDataset', LoadDatasetNodeData>;

type LoadDatasetNodeData = {
  datasetId: DatasetId;
  useDatasetIdInput?: boolean;
};

export class LoadDatasetNodeImpl extends NodeImpl<LoadDatasetNode> {
  static create(): LoadDatasetNode {
    return {
      id: newId<NodeId>(),
      type: 'loadDataset',
      title: 'Load Dataset',
      visualData: { x: 0, y: 0, width: 250 },
      data: {
        datasetId: '' as DatasetId,
      },
    };
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [];

    if (this.data.useDatasetIdInput) {
      inputs.push({
        id: 'datasetId' as PortId,
        title: 'Dataset ID',
        dataType: 'string',
      });
    }

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'dataset' as PortId,
        title: 'Dataset',
        dataType: 'object[]',
      },
      {
        id: 'datasetId_out' as PortId,
        title: 'Dataset ID',
        dataType: 'string',
      },
    ];
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Loads a dataset with the provided ID. If the dataset does not exist, it throws an error.
      `,
      infoBoxTitle: 'Load Dataset Node',
      contextMenuTitle: 'Load Dataset',
      group: ['Input/Output'],
    };
  }

  getEditors(): EditorDefinition<LoadDatasetNode>[] | Promise<EditorDefinition<LoadDatasetNode>[]> {
    return [
      {
        type: 'datasetSelector',
        label: 'Dataset',
        dataKey: 'datasetId',
        useInputToggleDataKey: 'useDatasetIdInput',
      },
    ];
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const { datasetProvider } = context;

    if (datasetProvider == null) {
      throw new Error('datasetProvider is required');
    }

    const datasetId = coerceTypeOptional(inputs['datasetId' as PortId], 'string') || this.data.datasetId;

    const dataset = await datasetProvider.getDatasetData(datasetId as DatasetId);

    if (!dataset) {
      throw new Error(`Dataset with ID ${datasetId} does not exist`);
    }

    return {
      ['dataset' as PortId]: {
        type: 'object[]',
        value: dataset.rows,
      },
      ['datasetId_out' as PortId]: {
        type: 'string',
        value: datasetId,
      },
    };
  }
}

export const loadDatasetNode = nodeDefinition(LoadDatasetNodeImpl, 'Load Dataset');
