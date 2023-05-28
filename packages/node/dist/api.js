"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runGraph = exports.createProcessor = exports.runGraphInFile = exports.loadProjectFromString = exports.loadProjectFromFile = void 0;
const core_1 = require("./core");
const promises_1 = require("node:fs/promises");
const NodeNativeApi_1 = require("./native/NodeNativeApi");
const lodash_es_1 = require("lodash-es");
async function loadProjectFromFile(path) {
    const content = await (0, promises_1.readFile)(path, { encoding: 'utf8' });
    return loadProjectFromString(content);
}
exports.loadProjectFromFile = loadProjectFromFile;
function loadProjectFromString(content) {
    const json = JSON.parse(content);
    if ('metadata' in json && 'graphs' in json) {
        return json;
    }
    throw new Error('Invalid project file');
}
exports.loadProjectFromString = loadProjectFromString;
async function runGraphInFile(path, options) {
    const project = await loadProjectFromFile(path);
    return runGraph(project, options);
}
exports.runGraphInFile = runGraphInFile;
function createProcessor(project, options) {
    const { graph, inputs = {}, context = {} } = options;
    const graphId = graph in project.graphs
        ? graph
        : Object.values(project.graphs).find((g) => g.metadata?.name === graph)?.metadata?.id;
    if (!graphId) {
        throw new Error('Graph not found');
    }
    const processor = new core_1.GraphProcessor(project, graphId);
    if (options.remoteDebugger) {
        options.remoteDebugger.attach(processor);
    }
    if (options.onStart) {
        processor.on('start', options.onStart);
    }
    if (options.onNodeStart) {
        processor.on('nodeStart', options.onNodeStart);
    }
    if (options.onNodeFinish) {
        processor.on('nodeFinish', options.onNodeFinish);
    }
    if (options.onNodeError) {
        processor.on('nodeError', options.onNodeError);
    }
    if (options.onNodeExcluded) {
        processor.on('nodeExcluded', options.onNodeExcluded);
    }
    if (options.onPartialOutput) {
        processor.on('partialOutput', options.onPartialOutput);
    }
    if (options.onUserInput) {
        processor.on('userInput', options.onUserInput);
    }
    if (options.onDone) {
        processor.on('done', options.onDone);
    }
    if (options.onAbort) {
        processor.on('abort', options.onAbort);
    }
    if (options.onTrace) {
        processor.on('trace', options.onTrace);
    }
    if (options.onNodeOutputsCleared) {
        processor.on('nodeOutputsCleared', options.onNodeOutputsCleared);
    }
    if (options.externalFunctions) {
        for (const [name, fn] of Object.entries(options.externalFunctions)) {
            processor.setExternalFunction(name, fn);
        }
    }
    if (options.onUserEvent) {
        for (const [name, fn] of Object.entries(options.onUserEvent)) {
            processor.onUserEvent(name, fn);
        }
    }
    options.abortSignal?.addEventListener('abort', () => {
        processor.abort();
    });
    const resolvedInputs = (0, lodash_es_1.mapValues)(inputs, (value) => {
        if (typeof value === 'string') {
            return { type: 'string', value };
        }
        if (typeof value === 'number') {
            return { type: 'number', value };
        }
        if (typeof value === 'boolean') {
            return { type: 'boolean', value };
        }
        return value;
    });
    const resolvedContextValues = (0, lodash_es_1.mapValues)(context, (value) => {
        if (typeof value === 'string') {
            return { type: 'string', value };
        }
        if (typeof value === 'number') {
            return { type: 'number', value };
        }
        if (typeof value === 'boolean') {
            return { type: 'boolean', value };
        }
        return value;
    });
    return {
        processor,
        inputs: resolvedInputs,
        contextValues: resolvedContextValues,
        async run() {
            const outputs = await processor.processGraph({
                nativeApi: options.nativeApi ?? new NodeNativeApi_1.NodeNativeApi(),
                settings: {
                    openAiKey: options.openAiKey,
                    openAiOrganization: options.openAiOrganization,
                },
            }, resolvedInputs, resolvedContextValues);
            return outputs;
        },
    };
}
exports.createProcessor = createProcessor;
async function runGraph(project, options) {
    const processorInfo = createProcessor(project, options);
    return processorInfo.run();
}
exports.runGraph = runGraph;
