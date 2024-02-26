import {
  type ChartNode,
  type NodeId,
  type NodeInputDefinition,
  type NodeOutputDefinition,
  type PortId,
} from '../NodeBase.js';
import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import { nodeDefinition } from '../NodeDefinition.js';
import { type Inputs, type Outputs } from '../GraphProcessor.js';
import { type GraphId } from '../NodeGraph.js';
import { nanoid } from 'nanoid/non-secure';
import { type InternalProcessContext } from '../ProcessContext.js';
import { type EditorDefinition, type NodeBody } from '../../index.js';
import { dedent } from 'ts-dedent';
import type { RivetUIContext } from '../RivetUIContext.js';
import { coerceType } from '../../utils/index.js';

export type GraphReferenceNode = ChartNode<'graphReference', GraphReferenceNodeData>;

export type GraphReferenceNodeData = {
  graphId: GraphId;
  useGraphIdOrNameInput: boolean;
};

export class GraphReferenceNodeImpl extends NodeImpl<GraphReferenceNode> {
  static create(): GraphReferenceNode {
    const chartNode: GraphReferenceNode = {
      type: 'graphReference',
      title: 'Graph Reference',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 275,
      },
      data: {
        graphId: '' as GraphId,
        useGraphIdOrNameInput: false,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [];

    if (this.data.useGraphIdOrNameInput) {
      inputs.push({
        id: 'graph-name-or-id' as PortId,
        dataType: 'string',
        title: 'Graph Name Or ID',
        description: 'The name or ID of the graph to get a reference to.',
        required: true,
      });
    }

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'graph' as PortId,
        dataType: 'graph-reference',
        title: 'Graph',
        description: 'A reference to the graph.',
      },
    ];
  }

  getEditors(): EditorDefinition<GraphReferenceNode>[] {
    const definitions: EditorDefinition<GraphReferenceNode>[] = [
      {
        type: 'graphSelector',
        label: 'Graph',
        dataKey: 'graphId',
        useInputToggleDataKey: 'useGraphIdOrNameInput',
      },
    ];

    return definitions;
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Gets a reference to another graph, that can be used to pass around graphs to call using a Call Graph node.
      `,
      infoBoxTitle: 'Graph Reference Node',
      contextMenuTitle: 'Graph Reference',
      group: ['Advanced'],
    };
  }

  getBody(context: RivetUIContext): string {
    if (this.data.useGraphIdOrNameInput) {
      return '(Graph from input)';
    }

    const graph = context.project.graphs[this.data.graphId];

    if (!graph) {
      return '(Graph not found)';
    }

    return graph.metadata!.name ?? '(Unnamed Graph)';
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    if (this.data.useGraphIdOrNameInput) {
      const graphIdOrName = coerceType(inputs['graph-name-or-id' as PortId], 'string');

      let graph = context.project.graphs[graphIdOrName as GraphId];

      if (!graph) {
        graph = Object.values(context.project.graphs).find((graph) => graph.metadata!.name === graphIdOrName);
      }

      if (!graph) {
        return {
          ['graph' as PortId]: {
            type: 'control-flow-excluded',
            value: undefined,
          },
        };
      }

      return {
        ['graph' as PortId]: {
          type: 'graph-reference',
          value: {
            graphId: graph.metadata!.id ?? ('' as GraphId),
            graphName: graph.metadata!.name ?? '',
          },
        },
      };
    }

    const graph = context.project.graphs[this.data.graphId];

    if (!graph) {
      return {
        ['graph' as PortId]: {
          type: 'control-flow-excluded',
          value: undefined,
        },
      };
    }

    return {
      ['graph' as PortId]: {
        type: 'graph-reference',
        value: {
          graphId: graph.metadata!.id ?? ('' as GraphId),
          graphName: graph.metadata!.name ?? '',
        },
      },
    };
  }
}

export const graphReferenceNode = nodeDefinition(GraphReferenceNodeImpl, 'Graph Reference');
