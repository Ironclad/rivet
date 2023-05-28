import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { nanoid } from 'nanoid';
import { InternalProcessContext, NodeImpl } from '../NodeImpl';
import {
  DataType,
  DataValue,
  ScalarDataValue,
  isArrayDataType,
  isScalarDataType,
  scalarDefaults,
  unwrapDataValue,
} from '../DataValue';
import { Inputs, Outputs } from '../GraphProcessor';
import { coerceType } from '../../utils/coerceType';

export type SetGlobalNode = ChartNode<'setGlobal', SetGlobalNodeData>;

export type SetGlobalNodeData = {
  id: string;
  useIdInput: boolean;
  dataType: DataType;
};

export class SetGlobalNodeImpl extends NodeImpl<SetGlobalNode> {
  static create(): SetGlobalNode {
    const chartNode: SetGlobalNode = {
      type: 'setGlobal',
      title: 'Set Global',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 200,
      },
      data: {
        id: 'variable-name',
        dataType: 'string',
        useIdInput: false,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputs = [
      {
        id: 'value' as PortId,
        title: 'Value',
        dataType: this.chartNode.data.dataType as DataType,
      },
    ];

    if (this.data.useIdInput) {
      inputs.push({
        id: 'id' as PortId,
        title: 'Variable ID',
        dataType: 'string',
      });
    }

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'saved-value' as PortId,
        title: 'Value',
        dataType: this.data.dataType,
      },
      {
        id: 'previous-value' as PortId,
        title: 'Previous Value',
        dataType: this.data.dataType,
      },
    ];
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const rawValue = inputs['value' as PortId]!;
    if (!rawValue) {
      return {};
    }

    const id = this.data.useIdInput ? coerceType(inputs['id' as PortId], 'string') : this.data.id;

    if (!id) {
      throw new Error('Missing variable ID');
    }

    let previousValue = context.getGlobal(this.data.id);
    if (!previousValue && isArrayDataType(this.data.dataType)) {
      previousValue = { type: this.data.dataType, value: [] };
    } else if (!previousValue && isScalarDataType(this.data.dataType)) {
      previousValue = { type: this.data.dataType, value: scalarDefaults[this.data.dataType] } as ScalarDataValue;
    }

    const value = unwrapDataValue(rawValue);

    context.setGlobal(id, value);

    return {
      ['saved-value' as PortId]: value,
      ['previous-value' as PortId]: previousValue,
    };
  }
}
