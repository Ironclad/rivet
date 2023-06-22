"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startDebuggerServer = exports.currentDebuggerState = void 0;
const ws_1 = __importStar(require("ws"));
const core_1 = require("./core");
const ts_pattern_1 = require("ts-pattern");
const emittery_1 = __importDefault(require("emittery"));
exports.currentDebuggerState = {
    uploadedProject: undefined,
    settings: undefined,
};
function startDebuggerServer(options = {}) {
    const { port = 21888 } = options;
    const server = options.server ?? new ws_1.WebSocketServer({ port });
    const emitter = new emittery_1.default();
    const attachedProcessors = [];
    server.on('connection', (socket) => {
        socket.on('message', async (data) => {
            try {
                const message = JSON.parse(data.toString());
                if (message.type === 'run') {
                    const { graphId } = message.data;
                    await options.dynamicGraphRun?.({ client: socket, graphId });
                }
                else if (message.type === 'set-dynamic-data' && options.allowGraphUpload) {
                    const { project, settings } = message.data;
                    exports.currentDebuggerState.uploadedProject = project;
                    exports.currentDebuggerState.settings = settings;
                }
                else {
                    const processors = options.getProcessorsForClient?.(socket, attachedProcessors) ?? attachedProcessors;
                    for (const processor of processors) {
                        await (0, ts_pattern_1.match)(message)
                            .with({ type: 'abort' }, async () => {
                            await processor.abort();
                        })
                            .with({ type: 'pause' }, async () => {
                            processor.pause();
                        })
                            .with({ type: 'resume' }, async () => {
                            processor.resume();
                        })
                            .otherwise(async () => {
                            throw new Error(`Unknown message type: ${message.type}`);
                        });
                    }
                }
            }
            catch (err) {
                try {
                    await emitter.emit('error', (0, core_1.getError)(err));
                }
                catch (err) {
                    // noop, just prevent unhandled rejection
                }
            }
        });
        if (options.allowGraphUpload) {
            socket.send(JSON.stringify({
                message: 'graph-upload-allowed',
                data: {},
            }));
        }
    });
    return {
        on: emitter.on.bind(emitter),
        off: emitter.off.bind(emitter),
        webSocketServer: server,
        /** Given an event on a processor, sends that processor's events to the correct debugger clients (allows routing debugger). */
        broadcast(procesor, message, data) {
            const clients = options.getClientsForProcessor?.(procesor, [...server.clients]) ?? [...server.clients];
            clients.forEach((client) => {
                if (client.readyState === ws_1.default.OPEN) {
                    client.send(JSON.stringify({ message, data }));
                }
            });
        },
        attach(processor) {
            if (attachedProcessors.find((p) => p.id === processor.id)) {
                return;
            }
            attachedProcessors.push(processor);
            processor.on('nodeStart', (data) => {
                this.broadcast(processor, 'nodeStart', data);
            });
            processor.on('nodeFinish', (data) => {
                this.broadcast(processor, 'nodeFinish', data);
            });
            processor.on('nodeError', ({ node, error, processId }) => {
                this.broadcast(processor, 'nodeError', {
                    node,
                    error: typeof error === 'string' ? error : error.toString(),
                    processId,
                });
            });
            processor.on('error', ({ error }) => {
                this.broadcast(processor, 'error', {
                    error: typeof error === 'string' ? error : error.toString(),
                });
            });
            processor.on('graphError', ({ graph, error }) => {
                this.broadcast(processor, 'graphError', {
                    graph,
                    error: typeof error === 'string' ? error : error.toString(),
                });
            });
            processor.on('nodeExcluded', (data) => {
                this.broadcast(processor, 'nodeExcluded', data);
            });
            processor.on('start', () => {
                this.broadcast(processor, 'start', null);
            });
            processor.on('done', (data) => {
                this.broadcast(processor, 'done', data);
            });
            processor.on('partialOutput', (data) => {
                this.broadcast(processor, 'partialOutput', data);
            });
            processor.on('abort', () => {
                this.broadcast(processor, 'abort', null);
            });
            processor.on('trace', (message) => {
                this.broadcast(processor, 'trace', message);
            });
            processor.on('nodeOutputsCleared', (data) => {
                this.broadcast(processor, 'nodeOutputsCleared', data);
            });
            processor.on('graphStart', (data) => {
                this.broadcast(processor, 'graphStart', data);
            });
            processor.on('graphFinish', (data) => {
                this.broadcast(processor, 'graphFinish', data);
            });
            processor.on('pause', () => {
                this.broadcast(processor, 'pause', null);
            });
            processor.on('resume', () => {
                this.broadcast(processor, 'resume', null);
            });
        },
        detach(processor) {
            const processorIndex = attachedProcessors.findIndex((p) => p.id === processor.id);
            if (processorIndex !== -1) {
                attachedProcessors.splice(processorIndex, 1);
            }
        },
    };
}
exports.startDebuggerServer = startDebuggerServer;
