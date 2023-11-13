import type { ChartNode, NodeId, PortId, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase.js';
import { NodeImpl, type NodeBody, type NodeUIData } from '../NodeImpl.js';
import { nanoid } from 'nanoid/non-secure';

import type { InternalProcessContext } from '../ProcessContext.js';
import { dedent } from 'ts-dedent';
import { nodeDefinition } from '../NodeDefinition.js';
import { getInputOrData, coerceType, newId, inferType } from '../../utils/index.js';
import { arrayizeDataValue, unwrapDataValue } from '../DataValue.js';
import type { DatasetId, DatasetRow } from '../Dataset.js';
import type { EditorDefinition } from '../EditorDefinition.js';
import type { Inputs, Outputs } from '../GraphProcessor.js';
import type { RivetUIContext } from '../RivetUIContext.js';

export type ReplaceDatasetNode = ChartNode<'replaceDataset', ReplaceDatasetNodeData>;

type ReplaceDatasetNodeData = {
  datasetId: DatasetId;
  useDatasetIdInput?: boolean;
};

export class ReplaceDatasetNodeImpl extends NodeImpl<ReplaceDatasetNode> {
  static create(): ReplaceDatasetNode {
    return {
      id: nanoid() as NodeId,
      type: 'replaceDataset',
      title: 'Replace Dataset',
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
      dataType: 'object[]',
      title: 'Data',
      description:
        'The new data of the dataset. If empty, the dataset will be cleared. May be an array of array of strings, or an array of DatasetRow objects with { id, data } properties. If a string[][], IDs will be generated.',
    });

    if (this.data.useDatasetIdInput) {
      inputDefinitions.push({
        id: 'datasetId' as PortId,
        title: 'Dataset ID',
        dataType: 'string',
        description: 'The ID of the dataset to replace.',
      });
    }

    return inputDefinitions;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'dataset' as PortId,
        title: 'Dataset',
        dataType: 'object[]',
        description: 'The new data of the dataset. An array of DatasetRow objects with { id, data } properties.',
      },
    ];
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Replaces the data in a dataset with the given data. If no data is given, the dataset will be cleared instead.
      `,
      infoBoxTitle: 'Replace Dataset Node',
      contextMenuTitle: 'Replace Dataset',
      group: ['Input/Output'],
    };
  }

  getEditors(): EditorDefinition<ReplaceDatasetNode>[] | Promise<EditorDefinition<ReplaceDatasetNode>[]> {
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
    const dataInput = inputs['data' as PortId];

    if (!dataInput) {
      await datasetProvider.putDatasetData(datasetId, { id: datasetId, rows: [] });
      return {
        ['dataset' as PortId]: {
          type: 'object[]',
          value: [],
        },
      };
    }

    let dataArrays = unwrapDataValue(dataInput).value as unknown[][] | unknown[] | DatasetRow[];
    if (!Array.isArray(dataArrays)) {
      throw new Error('Data input must be either an array of rows, or an array of columns for a single row.');
    }

    const isDatasetRow = (row: unknown): row is DatasetRow => {
      return typeof row === 'object' && row != null && 'id' in row && 'data' in row;
    };

    const firstElem = dataArrays[0];
    if (!Array.isArray(firstElem) && !isDatasetRow(firstElem)) {
      dataArrays = [dataArrays as unknown[]];
    }

    const rows = (dataArrays as unknown[][] | DatasetRow[]).map((row): DatasetRow => {
      if (Array.isArray(row)) {
        return {
          id: newId(),
          data: row.map((value) => coerceType(inferType(value), 'string')),
        };
      }

      if ('id' in row && 'data' in row) {
        return row;
      }

      throw new Error('Data input must be an array of strings or DatasetRows');
    });

    await datasetProvider.putDatasetData(datasetId, {
      id: datasetId,
      rows,
    });

    return {
      ['dataset' as PortId]: {
        type: 'object[]',
        value: rows,
      },
    };
  }
}

export const replaceDatasetNode = nodeDefinition(ReplaceDatasetNodeImpl, 'Replace Dataset');
