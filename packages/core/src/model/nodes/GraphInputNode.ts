import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { nanoid } from 'nanoid';
import { NodeImpl } from '../NodeImpl';
import { DataType, DataValue, getDefaultValue, isArrayDataType } from '../DataValue';
import { GraphInputs, Inputs, Outputs } from '../GraphProcessor';
import { InternalProcessContext } from '../ProcessContext';

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

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Record<string, DataValue>> {
    let inputValue = context.graphInputs[this.data.id];

    if (inputValue == null && this.data.useDefaultValueInput) {
      inputValue = inputs['default' as PortId];
    }

    if (inputValue == null) {
      inputValue = {
        type: this.data.dataType,
        value: this.data.defaultValue || getDefaultValue(this.data.dataType),
      } as DataValue;
    }

    // Resolve undefined for array inputs to empty array
    if ((inputValue == null || inputValue.value == null) && isArrayDataType(this.data.dataType)) {
      inputValue = { type: this.data.dataType, value: [] } as DataValue;
    }

    return { ['data' as PortId]: inputValue };
  }
}
