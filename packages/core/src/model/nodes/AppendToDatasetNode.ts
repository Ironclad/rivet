import { ChartNode, NodeId, PortId } from '../NodeBase.js';
import { NodeInputDefinition, NodeOutputDefinition } from '../NodeBase.js';
import { NodeImpl, NodeUIData, nodeDefinition } from '../NodeImpl.js';
import { nanoid } from 'nanoid/non-secure';
import {
  DataValue,
  DatasetId,
  EditorDefinition,
  Inputs,
  NodeBodySpec,
  Outputs,
  arrayizeDataValue,
  coerceType,
  coerceTypeOptional,
  expectType,
  getInputOrData,
  newId,
  unwrapDataValue,
} from '../../index.js';
import { InternalProcessContext } from '../ProcessContext.js';
import { dedent } from 'ts-dedent';

export type AppendToDatasetNode = ChartNode<'appendToDataset', AppendToDatasetNodeData>;

type AppendToDatasetNodeData = {
  datasetId: DatasetId;
  useDatasetIdInput?: boolean;
};

export class AppendToDatasetNodeImpl extends NodeImpl<AppendToDatasetNode> {
  static create(): AppendToDatasetNode {
    return {
      id: nanoid() as NodeId,
      type: 'appendToDataset',
      title: 'Append to Dataset',
      visualData: { x: 0, y: 0, width: 250 },
      data: {
        datasetId: '' as DatasetId,
      },
    };
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputDefinitions: NodeInputDefinition[] = [];

    inputDefinitions.push({
      id: 'data' as PortId,
      dataType: 'string[]',
      title: 'Data',
    });

    inputDefinitions.push({
      id: 'id' as PortId,
      dataType: 'string',
      title: 'ID',
    });

    if (this.data.useDatasetIdInput) {
      inputDefinitions.push({
        id: 'datasetId' as PortId,
        title: 'Dataset ID',
        dataType: 'string',
      });
    }

    return inputDefinitions;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'dataset' as PortId,
        title: 'Dataset',
        dataType: 'object', // technically string[][]...
      },
      {
        id: 'id_out' as PortId,
        title: 'ID',
        dataType: 'string',
      },
    ];
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Appends a row of data to the specified dataset.
      `,
      infoBoxTitle: 'Append to Dataset Node',
      contextMenuTitle: 'Append to Dataset',
      group: ['Input/Output'],
    };
  }

  getEditors(): EditorDefinition<AppendToDatasetNode>[] | Promise<EditorDefinition<AppendToDatasetNode>[]> {
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

    const datasetId = getInputOrData(this.data, inputs, 'datasetId', 'string') as DatasetId;

    const dataId = coerceTypeOptional(inputs['id' as PortId], 'string') || newId<DatasetId>();

    const dataInput = inputs['data' as PortId];

    if (!dataInput) {
      throw new Error('data input is required');
    }

    const data = arrayizeDataValue(unwrapDataValue(dataInput));
    const stringData = data.map((d) => coerceType(d, 'string'));

    const dataset = await datasetProvider.getDatasetData(datasetId);

    const newData = [...dataset.rows];

    newData.push({
      id: dataId,
      data: stringData,
    });

    await datasetProvider.putDatasetData(datasetId, {
      ...dataset,
      rows: newData,
    });

    return {
      ['dataset' as PortId]: {
        type: 'object',
        value: newData as any,
      },
      ['id_out' as PortId]: {
        type: 'string',
        value: datasetId,
      },
    };
  }
}

export const appendToDatasetNode = nodeDefinition(AppendToDatasetNodeImpl, 'Append To Dataset');
