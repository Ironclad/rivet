import type { ChartNode, NodeId, PortId, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase.js';
import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import { nanoid } from 'nanoid/non-secure';

import type { InternalProcessContext } from '../ProcessContext.js';
import { dedent } from 'ts-dedent';
import { nodeDefinition } from '../NodeDefinition.js';
import { getInputOrData, coerceTypeOptional, newId, coerceType } from '../../utils/index.js';
import { arrayizeDataValue, unwrapDataValue } from '../DataValue.js';
import type { DatasetId, DatasetRow } from '../Dataset.js';
import type { EditorDefinition } from '../EditorDefinition.js';
import type { Inputs, Outputs } from '../GraphProcessor.js';

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
      description:
        'The data to append to the dataset. May be a string or array of strings. If an array, each element will be a column in the dataset.',
    });

    inputDefinitions.push({
      id: 'id' as PortId,
      dataType: 'string',
      title: 'ID',
      description:
        'The ID of the row to append. If not provided, a random ID will be generated. If an existing ID is provided, the row will be overwritten.',
    });

    inputDefinitions.push({
      id: 'embedding' as PortId,
      dataType: 'vector',
      title: 'Embedding',
      description: 'The vector embedding to store with the row.',
    });

    if (this.data.useDatasetIdInput) {
      inputDefinitions.push({
        id: 'datasetId' as PortId,
        title: 'Dataset ID',
        dataType: 'string',
        description: 'The ID of the dataset to append to.',
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
    const embedding = coerceTypeOptional(inputs['embedding' as PortId], 'vector');

    const dataInput = inputs['data' as PortId];

    if (!dataInput) {
      throw new Error('data input is required');
    }

    const data = arrayizeDataValue(unwrapDataValue(dataInput));
    const stringData = data.map((d) => coerceType(d, 'string'));

    const newData: DatasetRow = {
      id: dataId,
      data: stringData,
      embedding,
    };

    await datasetProvider.putDatasetRow(datasetId, newData);

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
