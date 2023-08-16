import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase.js';
import { NodeImpl, NodeUIData, nodeDefinition } from '../NodeImpl.js';
import { DataValue } from '../DataValue.js';
import { nanoid } from 'nanoid';
import { Inputs } from '../GraphProcessor.js';
import { coerceType } from '../../utils/coerceType.js';
import { InternalProcessContext } from '../ProcessContext.js';
import { dedent } from 'ts-dedent';
import { EditorDefinition } from '../EditorDefinition.js';
import { NodeBodySpec } from '../NodeBodySpec.js';

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
