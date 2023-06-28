// @ts-ignore
import * as yaml from 'yaml';
import stableStringify from 'safe-stable-stringify';
import { mapValues } from 'lodash-es';
export function serializeProject(project) {
    return projectV3Serializer(project);
}
export function deserializeProject(serializedProject) {
    try {
        return projectV3Deserializer(serializedProject);
    }
    catch (err) {
        try {
            return projectV2Deserializer(serializedProject);
        }
        catch (err) {
            try {
                return projectV1Deserializer(serializedProject);
            }
            catch (err) {
                throw new Error('Could not deserialize project');
            }
        }
    }
}
export function serializeGraph(graph) {
    return graphV3Serializer(graph);
}
export function deserializeGraph(serializedGraph) {
    try {
        return graphV3Deserializer(serializedGraph);
    }
    catch (err) {
        try {
            return graphV2Deserializer(serializedGraph);
        }
        catch (err) {
            try {
                return graphV1Deserializer(serializedGraph);
            }
            catch (err) {
                throw new Error('Could not deserialize graph');
            }
        }
    }
}
function projectV3Serializer(project) {
    // Make sure all data is ordered deterministically first
    const stabilized = JSON.parse(stableStringify(toSerializedProject(project)));
    const serialized = yaml.stringify({
        version: 3,
        data: stabilized,
    }, null, {
        indent: 2,
    });
    return serialized;
}
function projectV3Deserializer(data) {
    if (typeof data !== 'string') {
        throw new Error('Project v3 deserializer requires a string');
    }
    const serializedProject = yaml.parse(data);
    if (serializedProject.version !== 3) {
        throw new Error('Project v3 deserializer requires a version 3 project');
    }
    const project = fromSerializedProject(serializedProject.data);
    doubleCheckProject(project);
    return project;
}
function projectV2Deserializer(data) {
    if (typeof data !== 'string') {
        throw new Error('Project v2 deserializer requires a string');
    }
    const project = yaml.parse(data);
    if (project.version !== 2) {
        throw new Error('Project v2 deserializer requires a version 2 project');
    }
    doubleCheckProject(project.data);
    return project.data;
}
function projectV1Deserializer(data) {
    if (typeof data !== 'string') {
        throw new Error('Project v1 deserializer requires a string');
    }
    const project = JSON.parse(data);
    doubleCheckProject(project);
    return project;
}
function graphV3Serializer(graph) {
    // Make sure all data is ordered deterministically first
    const stabilized = JSON.parse(stableStringify(toSerializedGraph(graph)));
    const serialized = yaml.stringify({
        version: 3,
        data: stabilized,
    }, null, {
        indent: 2,
    });
    return serialized;
}
function graphV3Deserializer(data) {
    if (typeof data !== 'string') {
        throw new Error('Graph v3 deserializer requires a string');
    }
    const serializedGraph = yaml.parse(data);
    if (serializedGraph.version !== 3) {
        throw new Error('Graph v3 deserializer requires a version 3 graph');
    }
    return fromSerializedGraph(serializedGraph.data);
}
function graphV2Deserializer(data) {
    if (typeof data !== 'string') {
        throw new Error('Graph v2 deserializer requires a string');
    }
    const graph = yaml.parse(data);
    if (graph.version !== 2) {
        throw new Error('Graph v2 deserializer requires a version 2 graph');
    }
    return graph.data;
}
function graphV1Deserializer(data) {
    if (typeof data !== 'string') {
        throw new Error('Graph v1 deserializer requires a string');
    }
    const graph = JSON.parse(data);
    if (!graph.nodes || !graph.connections) {
        throw new Error('Invalid graph file');
    }
    return graph;
}
function doubleCheckProject(project) {
    if (!project.metadata ||
        !project.metadata.id ||
        !project.metadata.title ||
        !project.graphs ||
        typeof project.graphs !== 'object') {
        throw new Error('Invalid project file');
    }
}
function toSerializedProject(project) {
    return {
        metadata: project.metadata,
        graphs: mapValues(project.graphs, (graph) => toSerializedGraph(graph)),
    };
}
function fromSerializedProject(serializedProject) {
    return {
        metadata: serializedProject.metadata,
        graphs: mapValues(serializedProject.graphs, (graph) => fromSerializedGraph(graph)),
    };
}
function toSerializedGraph(graph) {
    return {
        metadata: {
            id: graph.metadata.id,
            name: graph.metadata.name,
            description: graph.metadata.description,
        },
        nodes: graph.nodes.reduce((acc, node) => ({
            ...acc,
            [node.id]: toSerializedNode(node, graph.nodes, graph.connections),
        }), {}),
    };
}
function fromSerializedGraph(serializedGraph) {
    const allConnections = [];
    const allNodes = [];
    for (const node of Object.values(serializedGraph.nodes)) {
        const [chartNode, connections] = fromSerializedNode(node);
        allNodes.push(chartNode);
        allConnections.push(...connections);
    }
    return {
        metadata: {
            id: serializedGraph.metadata.id,
            name: serializedGraph.metadata.name,
            description: serializedGraph.metadata.description,
        },
        nodes: allNodes,
        connections: allConnections,
    };
}
function toSerializedNode(node, allNodes, allConnections) {
    return {
        id: node.id,
        title: node.title,
        description: node.description,
        type: node.type,
        visualData: `${node.visualData.x}/${node.visualData.y}/${node.visualData.width ?? 'null'}/${node.visualData.zIndex ?? 'null'}`,
        isSplitRun: node.isSplitRun,
        splitRunMax: node.splitRunMax,
        data: node.data,
        outgoingConnections: allConnections
            .filter((connection) => connection.outputNodeId === node.id)
            .map((connection) => toSerializedConnection(connection, allNodes))
            .sort(),
        variants: (node.variants?.length ?? 0) > 0 ? node.variants : undefined,
    };
}
function fromSerializedNode(serializedNode) {
    const [x, y, width, zIndex] = serializedNode.visualData.split('/');
    const connections = serializedNode.outgoingConnections.map((serializedConnection) => fromSerializedConnection(serializedConnection, serializedNode));
    return [
        {
            id: serializedNode.id,
            title: serializedNode.title,
            description: serializedNode.description,
            type: serializedNode.type,
            isSplitRun: serializedNode.isSplitRun,
            splitRunMax: serializedNode.splitRunMax,
            visualData: {
                x: parseFloat(x),
                y: parseFloat(y),
                width: width === 'null' ? undefined : parseFloat(width),
                zIndex: zIndex === 'null' ? undefined : parseFloat(zIndex),
            },
            data: serializedNode.data,
            variants: serializedNode.variants,
        },
        connections,
    ];
}
function toSerializedConnection(connection, allNodes) {
    return `${connection.outputId}->"${allNodes.find((node) => node.id === connection.inputNodeId)?.title}" ${connection.inputNodeId}/${connection.inputId}`;
}
function fromSerializedConnection(connection, outgoingNode) {
    const [, outputId, , inputNodeId, inputId] = connection.match(/(.+)->"(.+)" (.+)\/(.+)/);
    return {
        outputId: outputId,
        outputNodeId: outgoingNode.id,
        inputId: inputId,
        inputNodeId: inputNodeId,
    };
}
