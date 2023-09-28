import {
  type ChartNode,
  type NodeId,
  type NodeInputDefinition,
  type PortId,
  type NodeOutputDefinition,
} from '../NodeBase.js';
import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import { nodeDefinition } from '../NodeDefinition.js';
import { type DataValue } from '../DataValue.js';
import { nanoid } from 'nanoid/non-secure';
import { type Inputs } from '../GraphProcessor.js';
import { coerceType } from '../../utils/coerceType.js';
import { type InternalProcessContext } from '../ProcessContext.js';
import { dedent } from 'ts-dedent';
import { type EditorDefinition } from '../EditorDefinition.js';
import { type NodeBodySpec } from '../NodeBodySpec.js';

export type RaiseEventNode = ChartNode<'raiseEvent', RaiseEventNodeData>;

export type RaiseEventNodeData = {
  eventName: string;
  useEventNameInput: boolean;
};

export class RaiseEventNodeImpl extends NodeImpl<RaiseEventNode> {
  static create(): RaiseEventNode {
    return {
      id: nanoid() as NodeId,
      type: 'raiseEvent',
      title: 'Raise Event',
      visualData: { x: 0, y: 0, width: 150 },
      data: {
        eventName: 'toast',
        useEventNameInput: false,
      },
    };
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputDefinitions: NodeInputDefinition[] = [];

    if (this.chartNode.data.useEventNameInput) {
      inputDefinitions.push({
        id: 'eventName' as PortId,
        title: 'Event Name',
        dataType: 'string',
      });
    }

    inputDefinitions.push({
      id: 'data' as PortId,
      title: 'Data',
      dataType: 'any',
    });

    return inputDefinitions;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'result' as PortId,
        title: 'Result',
        dataType: 'any',
      },
    ];
  }

  getEditors(): EditorDefinition<RaiseEventNode>[] {
    return [
      {
        type: 'string',
        label: 'Event Name',
        dataKey: 'eventName',
        useInputToggleDataKey: 'useEventNameInput',
      },
    ];
  }

  getBody(): string | NodeBodySpec | undefined {
    return this.data.useEventNameInput ? '(Using Input)' : this.data.eventName;
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Raises an event that the host project or a 'Wait For Event' node can listen for.
      `,
      infoBoxTitle: 'Raise Event Node',
      contextMenuTitle: 'Raise Event',
      group: ['Advanced'],
    };
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Record<string, DataValue>> {
    const eventName = this.chartNode.data.useEventNameInput
      ? coerceType(inputs['eventName' as PortId], 'string')
      : this.chartNode.data.eventName;

    const eventData = inputs['data' as PortId];

    context.raiseEvent(eventName, eventData);

    return {
      result: eventData as DataValue,
    };
  }
}

export const raiseEventNode = nodeDefinition(RaiseEventNodeImpl, 'Raise Event');
