import { NodeImpl, nodeDefinition } from '../NodeImpl';
import { nanoid } from 'nanoid';
import { coerceType } from '../../utils/coerceType';
export class WaitForEventNodeImpl extends NodeImpl {
    static create() {
        return {
            id: nanoid(),
            type: 'waitForEvent',
            title: 'Wait For Event',
            visualData: { x: 0, y: 0, width: 150 },
            data: {
                eventName: 'continue',
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
            id: 'inputData',
            title: 'Data',
            dataType: 'any',
        });
        return inputDefinitions;
    }
    getOutputDefinitions() {
        return [
            {
                id: 'outputData',
                title: 'Data',
                dataType: 'any',
            },
            {
                id: 'eventData',
                title: 'Event Data',
                dataType: 'any',
            },
        ];
    }
    getEditors() {
        return [
            {
                type: 'string',
                label: 'Event Name',
                dataKey: 'eventName',
                useInputToggleDataKey: 'useEventNameInput',
            },
        ];
    }
    async process(inputs, context) {
        const eventName = this.chartNode.data.useEventNameInput
            ? coerceType(inputs['eventName'], 'string')
            : this.chartNode.data.eventName;
        const eventData = await context.waitEvent(eventName);
        return {
            ['outputData']: inputs['inputData'],
            ['eventData']: eventData,
        };
    }
}
export const waitForEventNode = nodeDefinition(WaitForEventNodeImpl, 'Wait For Event');
