import { NodeImpl } from '../NodeImpl';
import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase';
import { DataValue } from '../DataValue';
import { nanoid } from 'nanoid';

export type IfElseNode = ChartNode<'ifElse', IfElseNodeData>;

export type IfElseNodeData = {};

export class IfElseNodeImpl extends NodeImpl<ChartNode> {
  static create = (): IfElseNode => {
    const chartNode: IfElseNode = {
      type: 'ifElse',
      title: 'If/Else',
      id: nanoid() as NodeId,
      data: {},
      visualData: {
        x: 0,
        y: 0,
        width: 125,
      },
    };
    return chartNode;
  };
  getInputDefinitions(): NodeInputDefinition[] {
    return [
      {
        id: 'if' as PortId,
        title: 'If',
        dataType: 'any',
      },
      {
        id: 'true' as PortId,
        title: 'True',
        dataType: 'any',
      },
      {
        id: 'false' as PortId,
        title: 'False',
        dataType: 'any',
      },
    ];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'output' as PortId,
        title: 'Output',
        dataType: 'any',
      },
    ];
  }

  async process(inputData: Record<PortId, DataValue>): Promise<Record<PortId, DataValue>> {
    const ifValue = inputData['if' as PortId];
    const trueValue = inputData['true' as PortId];
    const falseValue = inputData['false' as PortId];

    if (!ifValue || (!trueValue && !falseValue)) {
      return {
        ['output' as PortId]: {
          type: 'control-flow-excluded',
          value: undefined,
        },
      };
    }

    if (ifValue && ifValue.type !== 'control-flow-excluded') {
      return {
        ['output' as PortId]: trueValue!,
      };
    } else {
      return {
        ['output' as PortId]: falseValue!,
      };
    }
  }
}
