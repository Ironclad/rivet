import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase.js';
import { nanoid } from 'nanoid';
import { EditorDefinition, NodeBodySpec, NodeImpl, nodeDefinition } from '../NodeImpl.js';
import { DataType, DataValue } from '../DataValue.js';
import { Inputs, Outputs } from '../GraphProcessor.js';
import { InternalProcessContext } from '../ProcessContext.js';
import { dedent } from 'ts-dedent';

export type ContextNode = ChartNode<'context', ContextNodeData>;

export type ContextNodeData = {
  id: string;
  dataType: DataType;
  defaultValue?: unknown;
  useDefaultValueInput?: boolean;
};

export class ContextNodeImpl extends NodeImpl<ContextNode> {
  static create(id: string = 'input', dataType: DataType = 'string'): ContextNode {
    const chartNode: ContextNode = {
      type: 'context',
      title: 'Context',
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

  getEditors(): EditorDefinition<ContextNode>[] {
    return [
      { type: 'string', label: 'ID', dataKey: 'id' },
      { type: 'dataTypeSelector', label: 'Data Type', dataKey: 'dataType' },
      {
        type: 'anyData',
        label: 'Default Value',
        dataKey: 'defaultValue',
        useInputToggleDataKey: 'useDefaultValueInput',
      },
    ];
  }

  getBody(): string | NodeBodySpec | undefined {
    return dedent`
      ${this.data.id}
      Type: ${this.data.dataType}
    `;
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const contextValue = context.contextValues[this.data.id];

    if (contextValue !== undefined) {
      return {
        ['data' as PortId]: contextValue,
      };
    }

    let defaultValue;
    if (this.data.useDefaultValueInput) {
      defaultValue = inputs['default' as PortId]!;
    } else {
      defaultValue = { type: this.data.dataType, value: this.data.defaultValue } as DataValue;
    }

    return {
      ['data' as PortId]: defaultValue,
    };
  }
}

export const contextNode = nodeDefinition(ContextNodeImpl, 'Context');
