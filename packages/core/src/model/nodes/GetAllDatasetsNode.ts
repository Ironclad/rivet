import type {
  ChartNode,
  EditorDefinition,
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
import { dedent, newId } from '../../utils/index.js';
import { nodeDefinition } from '../NodeDefinition.js';

export type GetAllDatasetsNode = ChartNode<'getAllDatasets', GetAllDatasetsNodeData>;

type GetAllDatasetsNodeData = {};

export class GetAllDatasetsNodeImpl extends NodeImpl<GetAllDatasetsNode> {
  static create(): GetAllDatasetsNode {
    return {
      id: newId<NodeId>(),
      type: 'getAllDatasets',
      title: 'Get All Datasets',
      visualData: { x: 0, y: 0, width: 250 },
      data: {},
    };
  }

  getInputDefinitions(): NodeInputDefinition[] {
    return [];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'datasets' as PortId,
        title: 'Datasets',
        dataType: 'object[]',
      },
    ];
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Retrieves all datasets. If no datasets exist, it returns an empty array.
      `,
      infoBoxTitle: 'Get All Datasets Node',
      contextMenuTitle: 'Get All Datasets',
      group: ['Input/Output'],
    };
  }

  getEditors(): EditorDefinition<GetAllDatasetsNode>[] | Promise<EditorDefinition<GetAllDatasetsNode>[]> {
    return [];
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const { datasetProvider } = context;

    if (datasetProvider == null) {
      throw new Error('datasetProvider is required');
    }

    const datasets = await datasetProvider.getDatasetsForProject(context.project.metadata.id);

    return {
      ['datasets' as PortId]: {
        type: 'object[]',
        value: datasets,
      },
    };
  }
}

export const getAllDatasetsNode = nodeDefinition(GetAllDatasetsNodeImpl, 'Get All Datasets');
