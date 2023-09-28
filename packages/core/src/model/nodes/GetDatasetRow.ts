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
import { dedent, getInputOrData, newId } from '../../utils/index.js';
import { nodeDefinition } from '../NodeDefinition.js';

export type GetDatasetRowNode = ChartNode<'getDatasetRow', GetDatasetRowNodeData>;

type GetDatasetRowNodeData = {
  datasetId: DatasetId;
  useDatasetIdInput?: boolean;

  rowId: string;
  useRowIdInput?: boolean;
};

export class GetDatasetRowNodeImpl extends NodeImpl<GetDatasetRowNode> {
  static create(): GetDatasetRowNode {
    return {
      id: newId<NodeId>(),
      type: 'getDatasetRow',
      title: 'Get Dataset Row',
      visualData: { x: 0, y: 0, width: 250 },
      data: {
        datasetId: '' as DatasetId,
        rowId: '',
      },
    };
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [];

    if (this.data.useRowIdInput) {
      inputs.push({
        id: 'rowId' as PortId,
        title: 'Row ID',
        dataType: 'string',
      });
    }

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
        id: 'row' as PortId,
        title: 'Row',
        dataType: 'object',
      },
    ];
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Gets a row from a dataset with the provided ID. If the dataset or row does not exist, it throws an error.
      `,
      infoBoxTitle: 'Get Dataset Row Node',
      contextMenuTitle: 'Get Dataset Row',
      group: ['Input/Output'],
    };
  }

  getEditors(): EditorDefinition<GetDatasetRowNode>[] | Promise<EditorDefinition<GetDatasetRowNode>[]> {
    return [
      {
        type: 'datasetSelector',
        label: 'Dataset',
        dataKey: 'datasetId',
        useInputToggleDataKey: 'useDatasetIdInput',
      },
      {
        type: 'string',
        label: 'Row ID',
        dataKey: 'rowId',
        useInputToggleDataKey: 'useRowIdInput',
      },
    ];
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const { datasetProvider } = context;

    if (datasetProvider == null) {
      throw new Error('datasetProvider is required');
    }

    const datasetId = getInputOrData(this.data, inputs, 'datasetId', 'string') as DatasetId;
    const rowId = getInputOrData(this.data, inputs, 'rowId', 'string') as string;

    const dataset = await datasetProvider.getDatasetData(datasetId as DatasetId);

    if (!dataset) {
      throw new Error(`Dataset with ID ${datasetId} does not exist`);
    }

    // TODO be more efficient
    const row = dataset.rows.find((r) => r.id === rowId);

    if (!row) {
      return {
        ['row' as PortId]: {
          type: 'control-flow-excluded',
          value: undefined,
        },
      };
    }

    return {
      ['row' as PortId]: {
        type: 'object',
        value: row,
      },
    };
  }
}

export const getDatasetRowNode = nodeDefinition(GetDatasetRowNodeImpl, 'Get Dataset Row');
