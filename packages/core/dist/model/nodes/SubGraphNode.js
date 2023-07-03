import { NodeImpl, nodeDefinition } from '../NodeImpl';
import { nanoid } from 'nanoid';
import { getError } from '../..';
export class SubGraphNodeImpl extends NodeImpl {
    static create() {
        const chartNode = {
            type: 'subGraph',
            title: 'Subgraph',
            id: nanoid(),
            visualData: {
                x: 0,
                y: 0,
                width: 300,
            },
            data: {
                graphId: '',
                useErrorOutput: false,
            },
        };
        return chartNode;
    }
    getInputDefinitions(_connections, _nodes, project) {
        const graph = project.graphs[this.data.graphId];
        if (!graph) {
            return [];
        }
        const inputNodes = graph.nodes.filter((node) => node.type === 'graphInput');
        const inputIds = [...new Set(inputNodes.map((node) => node.data.id))].sort();
        return inputIds.map((id) => ({
            id: id,
            title: id,
            dataType: inputNodes.find((node) => node.data.id === id).data.dataType,
        }));
    }
    getGraphOutputs(project) {
        const graph = project.graphs[this.data.graphId];
        if (!graph) {
            return [];
        }
        const outputNodes = graph.nodes.filter((node) => node.type === 'graphOutput');
        const outputIds = [...new Set(outputNodes.map((node) => node.data.id))].sort();
        const outputs = outputIds.map((id) => ({
            id: id,
            title: id,
            dataType: outputNodes.find((node) => node.data.id === id).data.dataType,
        }));
        return outputs;
    }
    getOutputDefinitions(_connections, _nodes, project) {
        const outputs = [];
        outputs.push(...this.getGraphOutputs(project));
        if (this.data.useErrorOutput) {
            outputs.push({
                id: 'error',
                title: 'Error',
                dataType: 'string',
            });
        }
        return outputs;
    }
    getEditors() {
        return [
            {
                type: 'graphSelector',
                label: 'Graph',
                dataKey: 'graphId',
            },
            {
                type: 'toggle',
                label: 'Use Error Output',
                dataKey: 'useErrorOutput',
            },
        ];
    }
    async process(inputs, context) {
        const { project } = context;
        if (!project) {
            throw new Error('SubGraphNode requires a project to be set in the context.');
        }
        const subGraphProcessor = context.createSubProcessor(this.data.graphId);
        try {
            const outputs = await subGraphProcessor.processGraph(context, inputs, context.contextValues);
            if (this.data.useErrorOutput) {
                outputs['error'] = {
                    type: 'control-flow-excluded',
                    value: undefined,
                };
            }
            return outputs;
        }
        catch (err) {
            if (!this.data.useErrorOutput) {
                throw err;
            }
            const outputs = this.getGraphOutputs(context.project).reduce((obj, output) => ({
                ...obj,
                [output.id]: {
                    type: 'control-flow-excluded',
                    value: undefined,
                },
            }), {});
            outputs['error'] = {
                type: 'string',
                value: getError(err).message,
            };
            return outputs;
        }
    }
}
export const subGraphNode = nodeDefinition(SubGraphNodeImpl, 'Subgraph');
