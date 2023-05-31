import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { NodeImpl } from '../NodeImpl';
import { DataValue } from '../DataValue';
import { nanoid } from 'nanoid';
import { Inputs } from '../GraphProcessor';
import { coerceType } from '../../utils/coerceType';
import { InternalProcessContext } from '../ProcessContext';

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
