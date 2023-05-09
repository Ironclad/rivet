import { ChartNode, NodeId, NodeOutputDefinition, PortId, NodeInputDefinition } from '../NodeBase';
import { nanoid } from 'nanoid';
import { NodeImpl } from '../NodeImpl';
import { DataType, DataValue } from '../DataValue';

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
    return [];
  }

  async process(): Promise<Record<PortId, DataValue>> {
    // This node does not process any data, it just provides the output value
    return {};
  }
}
