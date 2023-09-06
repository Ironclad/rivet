import WebSocket, { WebSocketServer } from 'ws';
import {
  GraphId,
  GraphProcessor,
  Project,
  getError,
  Settings,
  GraphInputs,
  NodeId,
  StringArrayDataValue,
} from '@ironclad/rivet-core';
import { match } from 'ts-pattern';
import Emittery from 'emittery';

export interface RivetDebuggerServer {
  on: Emittery<DebuggerEvents>['on'];
  off: Emittery<DebuggerEvents>['off'];

  webSocketServer: WebSocketServer;

  broadcast(processor: GraphProcessor, message: string, data: unknown): void;

  attach(processor: GraphProcessor): void;
  detach(processor: GraphProcessor): void;
}

export interface DebuggerEvents {
  error: Error;
}

export const currentDebuggerState = {
  uploadedProject: undefined as Project | undefined,
  settings: undefined as Settings | undefined,
};

export type DynamicGraphRunOptions = {
  client: WebSocket;
  graphId: GraphId;
  inputs?: GraphInputs;
  runToNodeIds?: NodeId[];
};

export type DynamicGraphRun = (data: DynamicGraphRunOptions) => Promise<void>;

export function startDebuggerServer(
  options: {
    getClientsForProcessor?: (processor: GraphProcessor, allClients: WebSocket[]) => WebSocket[];
    getProcessorsForClient?: (client: WebSocket, allProcessors: GraphProcessor[]) => GraphProcessor[];
    server?: WebSocketServer;
    port?: number;
    dynamicGraphRun?: DynamicGraphRun;
    allowGraphUpload?: boolean;
  } = {},
): RivetDebuggerServer {
  const { port = 21888 } = options;

  const server = options.server ?? new WebSocketServer({ port });

  const emitter = new Emittery<DebuggerEvents>();

  const attachedProcessors: GraphProcessor[] = [];

  server.on('connection', (socket) => {
    socket.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString()) as { type: string; data: unknown };

        await match(message)
          .with({ type: 'run' }, async () => {
            const { graphId, inputs, runToNodeIds } = message.data as {
              graphId: GraphId;
              inputs: GraphInputs;
              runToNodeIds?: NodeId[];
            };

            await options.dynamicGraphRun?.({ client: socket, graphId, inputs, runToNodeIds });
          })
          .with({ type: 'set-dynamic-data' }, async () => {
            if (options.allowGraphUpload) {
              const { project, settings } = message.data as { project: Project; settings: Settings };
              currentDebuggerState.uploadedProject = project;
              currentDebuggerState.settings = settings;
            }
          })
          .otherwise(async () => {
            const processors = options.getProcessorsForClient?.(socket, attachedProcessors) ?? attachedProcessors;

            for (const processor of processors) {
              await match(message)
                .with({ type: 'abort' }, async () => {
                  await processor.abort();
                })
                .with({ type: 'pause' }, async () => {
                  processor.pause();
                })
                .with({ type: 'resume' }, async () => {
                  processor.resume();
                })
                .with({ type: 'user-input' }, async () => {
                  const { nodeId, answers } = message.data as { nodeId: NodeId; answers: StringArrayDataValue };
                  processor.userInput(nodeId, answers);
                })
                .otherwise(async () => {
                  throw new Error(`Unknown message type: ${message.type}`);
                });
            }
          });
      } catch (err) {
        try {
          await emitter.emit('error', getError(err));
        } catch (err) {
          // noop, just prevent unhandled rejection
        }
      }
    });

    if (options.allowGraphUpload) {
      socket.send(
        JSON.stringify({
          message: 'graph-upload-allowed',
          data: {},
        }),
      );
    }
  });

  return {
    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter),

    webSocketServer: server,

    /** Given an event on a processor, sends that processor's events to the correct debugger clients (allows routing debugger). */
    broadcast(procesor: GraphProcessor, message: string, data: unknown) {
      const clients = options.getClientsForProcessor?.(procesor, [...server.clients]) ?? [...server.clients];

      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ message, data }));
        }
      });
    },

    attach(processor: GraphProcessor) {
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
      processor.on('graphAbort', (data) => {
        this.broadcast(processor, 'graphAbort', data);
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
      processor.on('userInput', (data) => {
        this.broadcast(processor, 'userInput', data);
      });
    },

    detach(processor: GraphProcessor) {
      const processorIndex = attachedProcessors.findIndex((p) => p.id === processor.id);
      if (processorIndex !== -1) {
        attachedProcessors.splice(processorIndex, 1);
      }
    },
  };
}
