import { nanoid } from 'nanoid';
import { NodeImpl } from '../NodeImpl';
export class GraphOutputNodeImpl extends NodeImpl {
    static create(id = 'output', dataType = 'string') {
        const chartNode = {
            type: 'graphOutput',
            title: 'Graph Output',
            id: nanoid(),
            visualData: {
                x: 0,
                y: 0,
                width: 300,
            },
            data: {
                id,
                dataType,
            },
        };
        return chartNode;
    }
    getInputDefinitions() {
        return [
            {
                id: 'value',
                title: this.data.id,
                dataType: this.chartNode.data.dataType,
            },
        ];
    }
    getOutputDefinitions() {
        return [];
    }
    async process() {
        // This node does not process any data, it just provides the output value
        return {};
    }
}
