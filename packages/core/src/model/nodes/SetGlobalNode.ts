import {
  type ChartNode,
  type NodeId,
  type NodeInputDefinition,
  type PortId,
  type NodeOutputDefinition,
} from '../NodeBase.js';
import { nanoid } from 'nanoid/non-secure';
import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import { nodeDefinition } from '../NodeDefinition.js';
import {
  type DataType,
  type ScalarDataValue,
  isArrayDataType,
  isScalarDataType,
  scalarDefaults,
  unwrapDataValue,
} from '../DataValue.js';
import { type Inputs, type Outputs } from '../GraphProcessor.js';
import { coerceType } from '../../utils/coerceType.js';
import { type InternalProcessContext } from '../ProcessContext.js';
import { dedent } from 'ts-dedent';
import { type EditorDefinition } from '../EditorDefinition.js';
import { type NodeBodySpec } from '../NodeBodySpec.js';

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
      {
        id: 'variable_id_out' as PortId,
        title: 'Variable ID',
        dataType: 'string',
      },
    ];
  }

  getEditors(): EditorDefinition<SetGlobalNode>[] {
    return [
      {
        type: 'string',
        dataKey: 'id',
        useInputToggleDataKey: 'useIdInput',
        label: 'ID',
      },
      {
        type: 'dataTypeSelector',
        dataKey: 'dataType',
        label: 'Data Type',
        useInputToggleDataKey: 'useIdInput',
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
        Sets a global value that is shared across all graphs and subgraphs. The id of the global value and the value itself are configured in this node.
      `,
      infoBoxTitle: 'Set Global Node',
      contextMenuTitle: 'Set Global',
      group: ['Advanced'],
    };
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
      ['variable_id_out' as PortId]: { type: 'string', value: id },
    };
  }
}

export const setGlobalNode = nodeDefinition(SetGlobalNodeImpl, 'Set Global');
