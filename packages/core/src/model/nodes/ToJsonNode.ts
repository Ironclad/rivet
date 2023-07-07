import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase.js';
import { nanoid } from 'nanoid';
import { EditorDefinition, NodeImpl, nodeDefinition } from '../NodeImpl.js';
import { Inputs, Outputs } from '../GraphProcessor.js';
import { coerceType } from '../../index.js';

export type ToJsonNode = ChartNode<'toJson', ToJsonNodeData>;

export type ToJsonNodeData = {
  indented?: boolean;
};

export class ToJsonNodeImpl extends NodeImpl<ToJsonNode> {
  static create(): ToJsonNode {
    const chartNode: ToJsonNode = {
      type: 'toJson',
      title: 'To JSON',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 175,
      },
      data: {
        indented: true,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    return [
      {
        id: 'data' as PortId,
        title: 'Data',
        dataType: 'any',
        required: true,
      },
    ];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'json' as PortId,
        title: 'JSON',
        dataType: 'string',
      },
    ];
  }

  getEditors(): EditorDefinition<ToJsonNode>[] {
    return [
      {
        type: 'toggle',
        label: 'Indented',
        dataKey: 'indented',
      },
    ];
  }

  getBody(): string | undefined {
    return this.data.indented ? 'Indented' : 'Not indented';
  }

  async process(inputs: Inputs): Promise<Outputs> {
    const data = coerceType(inputs['data' as PortId], 'any');

    const toJson = this.data.indented ? JSON.stringify(data, null, 2) : JSON.stringify(data);

    return {
      ['json' as PortId]: {
        type: 'string',
        value: toJson,
      },
    };
  }
}

export const toJsonNode = nodeDefinition(ToJsonNodeImpl, 'To JSON');
