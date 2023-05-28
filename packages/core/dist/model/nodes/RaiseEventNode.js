import { NodeImpl } from '../NodeImpl';
import { nanoid } from 'nanoid';
import { coerceType } from '../../utils/coerceType';
export class RaiseEventNodeImpl extends NodeImpl {
    static create() {
        return {
            id: nanoid(),
            type: 'raiseEvent',
            title: 'Raise Event',
            visualData: { x: 0, y: 0, width: 150 },
            data: {
                eventName: 'toast',
                useEventNameInput: false,
            },
        };
    }
    getInputDefinitions() {
        const inputDefinitions = [];
        if (this.chartNode.data.useEventNameInput) {
            inputDefinitions.push({
                id: 'eventName',
                title: 'Event Name',
                dataType: 'string',
            });
        }
        inputDefinitions.push({
            id: 'data',
            title: 'Data',
            dataType: 'any',
        });
        return inputDefinitions;
    }
    getOutputDefinitions() {
        return [
            {
                id: 'result',
                title: 'Result',
                dataType: 'any',
            },
        ];
    }
    async process(inputs, context) {
        const eventName = this.chartNode.data.useEventNameInput
            ? coerceType(inputs['eventName'], 'string')
            : this.chartNode.data.eventName;
        const eventData = inputs['data'];
        context.raiseEvent(eventName, eventData);
        return {
            result: eventData,
        };
    }
}
