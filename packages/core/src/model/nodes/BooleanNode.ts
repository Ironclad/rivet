import { ChartNode, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase.js';
import { nanoid } from 'nanoid';
import { EditorDefinition, NodeImpl, nodeDefinition } from '../NodeImpl.js';
import { Inputs, Outputs } from '../GraphProcessor.js';
import { coerceTypeOptional } from '../../index.js';

export type BooleanNode = ChartNode<'boolean', BooleanNodeData>;

export type BooleanNodeData = {
  value?: boolean;
  useValueInput?: boolean;
};

export class BooleanNodeImpl extends NodeImpl<BooleanNode> {
  static create(): BooleanNode {
    const chartNode: BooleanNode = {
      type: 'boolean',
      title: 'Bool',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 130,
      },
      data: {
        value: false,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    return this.data.useValueInput
      ? [
          {
            dataType: 'any',
            id: 'input' as PortId,
            title: 'Input',
          },
        ]
      : [];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        dataType: 'boolean',
        id: 'value' as PortId,
        title: 'Value',
      },
    ];
  }

  getEditors(): EditorDefinition<BooleanNode>[] {
    return [{ type: 'toggle', label: 'Value', dataKey: 'value', useInputToggleDataKey: 'useValueInput' }];
  }

  getBody(): string | undefined {
    return this.data.useValueInput ? `(Input to bool)` : (this.data.value ?? false).toString();
  }

  async process(inputs: Inputs): Promise<Outputs> {
    const value = this.data.useValueInput
      ? coerceTypeOptional(inputs['input' as PortId], 'boolean') ?? this.data.value ?? false
      : this.data.value ?? false;

    return {
      ['value' as PortId]: {
        type: 'boolean',
        value,
      },
    };
  }
}

export const booleanNode = nodeDefinition(BooleanNodeImpl, 'Boolean');
