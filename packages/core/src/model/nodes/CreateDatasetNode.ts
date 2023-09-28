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
} from '../../index.js';
import { NodeImpl } from '../NodeImpl.js';
import { coerceTypeOptional, dedent, newId } from '../../utils/index.js';
import { nodeDefinition } from '../NodeDefinition.js';

export type CreateDatasetNode = ChartNode<'createDataset', CreateDatasetNodeData>;

type CreateDatasetNodeData = {};

export class CreateDatasetNodeImpl extends NodeImpl<CreateDatasetNode> {
  static create(): CreateDatasetNode {
    return {
      id: newId<NodeId>(),
      type: 'createDataset',
      title: 'Create Dataset',
      visualData: { x: 0, y: 0, width: 250 },
      data: {},
    };
  }

  getInputDefinitions(): NodeInputDefinition[] {
    return [
      {
        id: 'datasetId' as PortId,
        title: 'Dataset ID',
        dataType: 'string',
      },
      {
        id: 'datasetName' as PortId,
        title: 'Dataset Name',
        dataType: 'string',
      },
    ];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
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
        Creates a new dataset with the provided ID and name. If the dataset already exists, it does nothing.
      `,
      infoBoxTitle: 'Create Dataset Node',
      contextMenuTitle: 'Create Dataset',
      group: ['Input/Output'],
    };
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const { datasetProvider } = context;

    if (datasetProvider == null) {
      throw new Error('datasetProvider is required');
    }

    const datasetId =
      (coerceTypeOptional(inputs['datasetId' as PortId], 'string') as DatasetId | undefined) || newId<DatasetId>();
    const datasetName = coerceTypeOptional(inputs['datasetName' as PortId], 'string') || datasetId;

    const existingDataset = await datasetProvider.getDatasetMetadata(datasetId);

    if (!existingDataset) {
      await datasetProvider.putDatasetMetadata({
        id: datasetId,
        name: datasetName,
        description: '',
        projectId: context.project.metadata.id,
      });
    }

    return {
      ['datasetId_out' as PortId]: {
        type: 'string',
        value: datasetId || datasetName,
      },
    };
  }
}

export const createDatasetNode = nodeDefinition(CreateDatasetNodeImpl, 'Create Dataset');
