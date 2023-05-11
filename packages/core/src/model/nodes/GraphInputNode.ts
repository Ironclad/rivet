import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { nanoid } from 'nanoid';
import { NodeImpl } from '../NodeImpl';
import { DataType, DataValue } from '../DataValue';
import { GraphInputs, Inputs, Outputs } from '../GraphProcessor';

export type GraphInputNode = ChartNode<'graphInput', GraphInputNodeData>;

export type GraphInputNodeData = {
  id: string;
  dataType: DataType;
  defaultValue?: unknown;
  useDefaultValueInput?: boolean;
};

export class GraphInputNodeImpl extends NodeImpl<GraphInputNode> {
  static create(id: string = 'input', dataType: DataType = 'string'): GraphInputNode {
    const chartNode: GraphInputNode = {
      type: 'graphInput',
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
        defaultValue: undefined,
        useDefaultValueInput: false,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    if (this.data.useDefaultValueInput) {
      return [
        {
          id: 'default' as PortId,
          title: 'Default Value',
          dataType: this.chartNode.data.dataType as DataType,
        },
      ];
    }

    return [];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'data' as PortId,
        title: this.data.id,
        dataType: this.chartNode.data.dataType as DataType,
      },
    ];
  }

  async process(): Promise<Record<string, DataValue>> {
    // This node does not process any data, it just provides the input value
    return {};
  }

  async getOutputValuesFromGraphInput(graphInputs: GraphInputs, nodeInputs: Inputs): Promise<Outputs> {
    let inputValue = graphInputs[this.data.id];

    if (inputValue == null) {
      if (this.data.useDefaultValueInput) {
        inputValue = nodeInputs['default' as PortId];
      } else {
        inputValue = { type: this.data.dataType, value: this.data.defaultValue } as DataValue;
      }
    }

    // Resolve undefined for array inputs to empty array
    if ((inputValue == null || inputValue.value == null) && this.data.dataType.endsWith('[]')) {
      inputValue = { type: this.data.dataType, value: [] } as DataValue;
    }

    const outputValues = { ['data' as PortId]: inputValue } as Outputs;

    return outputValues;
  }
}
