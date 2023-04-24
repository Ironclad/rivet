import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { nanoid } from 'nanoid';
import { NodeImpl } from '../NodeImpl';
import { DataType, DataValue } from '../DataValue';

export type GraphInputNode = ChartNode<'graph-input', GraphInputNodeData>;

export type GraphInputNodeData = {
  id: string;
  dataType: string;
};

export class GraphInputNodeImpl extends NodeImpl<GraphInputNode> {
  static create(id: string, dataType: string): GraphInputNode {
    const chartNode: GraphInputNode = {
      type: 'graph-input',
      title: 'Graph Input',
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
    return [];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'output' as PortId,
        title: 'Output',
        dataType: this.chartNode.data.dataType as DataType,
      },
    ];
  }

  async process(): Promise<Record<string, DataValue>> {
    // This node does not process any data, it just provides the input value
    return {};
  }
}
