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
  type FunctionDataValues,
  type ScalarDataType,
  type ScalarDataValue,
  type ScalarOrArrayDataType,
  isArrayDataType,
  isScalarDataType,
  scalarDefaults,
} from '../DataValue.js';
import { type Inputs, type Outputs } from '../GraphProcessor.js';
import { coerceType } from '../../utils/coerceType.js';
import { type InternalProcessContext } from '../ProcessContext.js';
import { dedent } from 'ts-dedent';
import { type EditorDefinition, type NodeBodySpec } from '../../index.js';

export type GetGlobalNode = ChartNode<'getGlobal', GetGlobalNodeData>;

export type GetGlobalNodeData = {
  id: string;
  useIdInput: boolean;

  dataType: ScalarOrArrayDataType;

  /**
   * Returns a fn<value> instead of a value, so that the variable is read when nodes need it, rather than when this node executes.
   * The only time you wouldn't want this is to read a global at the start of a subgraph.
   */
  onDemand: boolean;

  /** Wait until the variable is available */
  wait: boolean;
};

export class GetGlobalNodeImpl extends NodeImpl<GetGlobalNode> {
  static create(): GetGlobalNode {
    const chartNode: GetGlobalNode = {
      type: 'getGlobal',
      title: 'Get Global',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 200,
      },
      data: {
        id: 'variable-name',
        dataType: 'string',
        onDemand: true,
        useIdInput: false,
        wait: false,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    if (this.data.useIdInput) {
      return [
        {
          id: 'id' as PortId,
          title: 'Variable ID',
          dataType: this.data.dataType as ScalarDataType,
        },
      ];
    }

    return [];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    const { onDemand, dataType } = this.chartNode.data;
    return [
      {
        id: 'value' as PortId,
        title: 'Value',
        dataType: onDemand ? (`fn<${dataType}>` as const) : dataType,
      },
      {
        id: 'variable_id_out' as PortId,
        title: 'Variable ID',
        dataType: 'string',
      },
    ];
  }

  getEditors(): EditorDefinition<GetGlobalNode>[] {
    return [
      {
        type: 'string',
        label: 'Variable ID',
        dataKey: 'id',
        useInputToggleDataKey: 'useIdInput',
      },
      {
        type: 'dataTypeSelector',
        label: 'Data Type',
        dataKey: 'dataType',
      },
      {
        type: 'toggle',
        label: 'On Demand',
        dataKey: 'onDemand',
      },
      {
        type: 'toggle',
        label: 'Wait',
        dataKey: 'wait',
      },
    ];
  }

  getBody(): string | NodeBodySpec | undefined {
    return dedent`
      ${this.data.useIdInput ? '(ID from input)' : this.data.id}
      Type: ${this.data.dataType}
      ${this.data.wait ? 'Waits for available data' : ''}
    `;
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Retrieves a global value that is shared across all graphs and subgraphs. The id of the global value is configured in this node.
      `,
      infoBoxTitle: 'Get Global Node',
      contextMenuTitle: 'Get Global',
      group: ['Advanced'],
    };
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    if (this.data.onDemand) {
      if (this.data.wait) {
        throw new Error('Cannot use onDemand and wait together');
      }
      return {
        ['value' as PortId]: {
          type: `fn<${this.data.dataType}>` as const,
          value: () => {
            const id = this.data.useIdInput ? coerceType(inputs['id' as PortId], 'string') : this.data.id;

            const value = context.getGlobal(id);
            if (value) {
              return value.value;
            }

            // Have some useful defaults before the value is set
            if (isArrayDataType(this.data.dataType)) {
              return [];
            }

            return scalarDefaults[this.data.dataType];
          },
        } as FunctionDataValues,
      };
    }

    const id = this.data.useIdInput ? coerceType(inputs['id' as PortId], 'string') : this.data.id;

    let value = this.data.wait ? await context.waitForGlobal(id) : context.getGlobal(id);

    // Have some useful defaults before the value is set
    if (!value && isArrayDataType(this.data.dataType)) {
      value = { type: this.data.dataType, value: [] };
    }

    if (!value && isScalarDataType(this.data.dataType)) {
      value = { type: this.data.dataType, value: scalarDefaults[this.data.dataType] } as ScalarDataValue;
    }

    return {
      ['value' as PortId]: value,
      ['variable_id_out' as PortId]: { type: 'string', value: id },
    };
  }
}

export const getGlobalNode = nodeDefinition(GetGlobalNodeImpl, 'Get Global');
