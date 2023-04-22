import { NodeImpl, ProcessContext } from '../NodeImpl';
import { ChartNode, NodeConnection, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase';
import { DataValue, ControlFlowExcludedDataValue } from '../DataValue';

export class IfNode extends NodeImpl<ChartNode> {
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
