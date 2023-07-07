import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase.js';
import { EditorDefinition, NodeImpl, nodeDefinition } from '../NodeImpl.js';
import { DataValue } from '../DataValue.js';
import { nanoid } from 'nanoid';
import { Inputs, Outputs } from '../GraphProcessor.js';
import { coerceType } from '../../utils/coerceType.js';
import { InternalProcessContext } from '../ProcessContext.js';

export type WaitForEventNode = ChartNode<'waitForEvent', WaitForEventNodeData>;

export type WaitForEventNodeData = {
  eventName: string;
  useEventNameInput: boolean;
};

export class WaitForEventNodeImpl extends NodeImpl<WaitForEventNode> {
  static create(): WaitForEventNode {
    return {
      id: nanoid() as NodeId,
      type: 'waitForEvent',
      title: 'Wait For Event',
      visualData: { x: 0, y: 0, width: 150 },
      data: {
        eventName: 'continue',
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
      id: 'inputData' as PortId,
      title: 'Data',
      dataType: 'any',
    });

    return inputDefinitions;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'outputData' as PortId,
        title: 'Data',
        dataType: 'any',
      },
      {
        id: 'eventData' as PortId,
        title: 'Event Data',
        dataType: 'any',
      },
    ];
  }

  getEditors(): EditorDefinition<WaitForEventNode>[] {
    return [
      {
        type: 'string',
        label: 'Event Name',
        dataKey: 'eventName',
        useInputToggleDataKey: 'useEventNameInput',
      },
    ];
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const eventName = this.chartNode.data.useEventNameInput
      ? coerceType(inputs['eventName' as PortId], 'string')
      : this.chartNode.data.eventName;

    const eventData = await context.waitEvent(eventName);

    return {
      ['outputData' as PortId]: inputs['inputData' as PortId],
      ['eventData' as PortId]: eventData,
    };
  }
}

export const waitForEventNode = nodeDefinition(WaitForEventNodeImpl, 'Wait For Event');
