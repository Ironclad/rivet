import { NodeImpl } from '../NodeImpl';
import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase';
import { DataValue, ControlFlowExcludedDataValue } from '../DataValue';
import { nanoid } from 'nanoid';

export type IfNode = ChartNode<'if', IfNodeData>;

export type IfNodeData = {};

export class IfNodeImpl extends NodeImpl<ChartNode> {
  static create = (): IfNode => {
    const chartNode: IfNode = {
      type: 'if',
      title: 'If',
      id: nanoid() as NodeId,
      data: {},
      visualData: {
        x: 0,
        y: 0,
        width: 100,
      },
    };
    return chartNode;
  };
  getInputDefinitions(connections: NodeConnection[]): NodeInputDefinition[] {
    return [
      {
        id: 'if' as PortId,
        title: 'If',
        dataType: 'string',
      },
      {
        id: 'value' as PortId,
        title: 'Value',
        dataType: 'string',
      },
    ];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'output' as PortId,
        title: 'Output',
        dataType: 'string',
      },
    ];
  }

  async process(inputData: Record<string, DataValue>): Promise<Record<string, DataValue>> {
    const ifValue = inputData['if'];
    const value = inputData['value'];

    if (ifValue && ifValue.type !== 'control-flow-excluded') {
      return {
        output: value,
      };
    } else {
      return {
        output: {
          type: 'control-flow-excluded',
          value: undefined,
        } as ControlFlowExcludedDataValue,
      };
    }
  }
}
