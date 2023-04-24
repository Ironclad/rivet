import { NodeImpl } from '../NodeImpl';
import { ChartNode, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase';
import { DataValue } from '../DataValue';
import { nanoid } from 'nanoid';

export type SplitRunNode = ChartNode<'splitRun', SplitRunNodeData>;

export type SplitRunNodeData = {
  max: number;
};

export class SplitRunNodeImpl extends NodeImpl<ChartNode> {
  static create = (): SplitRunNode => {
    const chartNode: SplitRunNode = {
      type: 'splitRun',
      title: 'Split Run',
      id: nanoid() as NodeId,
      data: {
        max: 10, // safe default
      },
      visualData: {
        x: 0,
        y: 0,
        width: 100,
      },
    };
    return chartNode;
  };

  getInputDefinitions(): NodeInputDefinition[] {
    return [
      {
        id: 'input' as PortId,
        title: 'Input',
        dataType: 'any[]',
      },
    ];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'output' as PortId,
        title: 'Output',
        dataType: 'any[]',
      },
    ];
  }

  async process(): Promise<Record<string, DataValue>> {
    // This method should be empty, as the actual processing will be handled in the GraphProcessor
    return {};
  }
}
