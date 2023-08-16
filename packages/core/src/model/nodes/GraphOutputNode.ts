import { ChartNode, NodeId, NodeOutputDefinition, PortId, NodeInputDefinition } from '../NodeBase.js';
import { nanoid } from 'nanoid';
import { NodeImpl, NodeUIData, nodeDefinition } from '../NodeImpl.js';
import { DataType, DataValue } from '../DataValue.js';
import { Inputs, Outputs } from '../GraphProcessor.js';
import { InternalProcessContext } from '../ProcessContext.js';
import { ControlFlowExcludedPort } from '../../utils/symbols.js';
import { dedent } from 'ts-dedent';
import { EditorDefinition } from '../EditorDefinition.js';
import { NodeBodySpec } from '../NodeBodySpec.js';

export type GraphOutputNode = ChartNode<'graphOutput', GraphOutputNodeData>;

export type GraphOutputNodeData = {
  id: string;
  dataType: DataType;
};

export class GraphOutputNodeImpl extends NodeImpl<GraphOutputNode> {
  static create(id: string = 'output', dataType: DataType = 'string'): GraphOutputNode {
    const chartNode: GraphOutputNode = {
      type: 'graphOutput',
      title: 'Graph Output',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 300,
      },
      data: {
        id,
        dataType,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    return [
      {
        id: 'value' as PortId,
        title: this.data.id,
        dataType: this.chartNode.data.dataType as DataType,
      },
    ];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'valueOutput' as PortId,
        title: this.data.id,
        dataType: this.chartNode.data.dataType as DataType,
      },
    ];
  }

  getEditors(): EditorDefinition<GraphOutputNode>[] {
    return [
      {
        type: 'string',
        label: 'ID',
        dataKey: 'id',
      },
      {
        type: 'dataTypeSelector',
        label: 'Data Type',
        dataKey: 'dataType',
      },
    ];
  }

  getBody(): string | NodeBodySpec | undefined {
    return dedent`
      ${this.data.id}
      Type: ${this.data.dataType}
    `;
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Each instance of this node represents an individual output of the graph. The value passed into this node becomes part of the overall output of the graph.
      `,
      infoBoxTitle: 'Graph Output Node',
      contextMenuTitle: 'Graph Output',
      group: ['Input/Output'],
    };
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const value = inputs['value' as PortId] ?? { type: 'any', value: undefined };

    const isExcluded = value.type === 'control-flow-excluded' || inputs[ControlFlowExcludedPort] != null;

    if (isExcluded && context.graphOutputs[this.data.id] == null) {
      context.graphOutputs[this.data.id] = {
        type: 'control-flow-excluded',
        value: undefined,
      };
    } else if (
      context.graphOutputs[this.data.id] == null ||
      context.graphOutputs[this.data.id]?.type === 'control-flow-excluded'
    ) {
      context.graphOutputs[this.data.id] = value;
    }

    if (isExcluded) {
      return {
        ['valueOutput' as PortId]: {
          type: 'control-flow-excluded',
          value: undefined,
        },
      };
    }

    return inputs;
  }
}

export const graphOutputNode = nodeDefinition(GraphOutputNodeImpl, 'Graph Output');
