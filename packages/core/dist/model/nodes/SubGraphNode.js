import { NodeImpl } from '../NodeImpl';
import { nanoid } from 'nanoid';
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
            },
        };
        return chartNode;
    }
    async process(inputs, context) {
        const { project } = context;
        if (!project) {
            throw new Error('SubGraphNode requires a project to be set in the context.');
        }
        const subGraphProcessor = context.createSubProcessor(this.data.graphId);
        const subGraphOutputs = await subGraphProcessor.processGraph(context, inputs, context.contextValues);
        // Get the outputs for the SubGraphNode.
        const outputs = this.getOutputValues(subGraphOutputs);
        return outputs;
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
    getOutputDefinitions(_connections, _nodes, project) {
        const graph = project.graphs[this.data.graphId];
        if (!graph) {
            return [];
        }
        const outputNodes = graph.nodes.filter((node) => node.type === 'graphOutput');
        const outputIds = [...new Set(outputNodes.map((node) => node.data.id))].sort();
        return outputIds.map((id) => ({
            id: id,
            title: id,
            dataType: outputNodes.find((node) => node.data.id === id).data.dataType,
        }));
    }
    getInputValues(inputs) {
        // Extract the input values for the subgraph from the inputs.
        // This can be customized based on your requirements.
        return inputs;
    }
    getOutputValues(subGraphOutputs) {
        // Extract the output values for the SubGraphNode from the subGraphOutputs.
        // This can be customized based on your requirements.
        return subGraphOutputs;
    }
}
