import type {
  ChartNode,
  EditorDefinition,
  GraphId,
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

export type ListGraphsNode = ChartNode<'listGraphs', ListSubgraphsData>;

type ListSubgraphsData = {};

export class ListGraphsNodeImpl extends NodeImpl<ListGraphsNode> {
  static create(): ListGraphsNode {
    return {
      id: newId<NodeId>(),
      type: 'listGraphs',
      title: 'List Graphs',
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
        id: 'graphs' as PortId,
        title: 'Graphs',
        dataType: 'graph-reference[]',
      },
      {
        id: 'graph-names' as PortId,
        title: 'Graph Names',
        dataType: 'string[]',
      },
    ];
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Lists all graphs in the project.
      `,
      infoBoxTitle: 'List Graphs Node',
      contextMenuTitle: 'List Graphs',
      group: ['Input/Output'],
    };
  }

  getEditors(): EditorDefinition<ListGraphsNode>[] | Promise<EditorDefinition<ListGraphsNode>[]> {
    return [];
  }

  async process(_inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const graphs = Object.values(context.project.graphs);

    return {
      ['graphs' as PortId]: {
        type: 'graph-reference[]',
        value: graphs.map((graph) => ({
          graphId: graph.metadata!.id ?? ('' as GraphId),
          graphName: graph.metadata!.name ?? '',
        })),
      },
      ['graph-names' as PortId]: {
        type: 'string[]',
        value: graphs.map((graph) => graph.metadata!.name ?? ''),
      },
    };
  }
}

export const listGraphsNode = nodeDefinition(ListGraphsNodeImpl, 'List Graphs');
