import WebSocket, { WebSocketServer } from 'ws';
import {
  type GraphId,
  type GraphProcessor,
  type Project,
  getError,
  type Settings,
  type GraphInputs,
  type NodeId,
  type StringArrayDataValue,
  type DataId,
  type DataValue,
} from '@ironclad/rivet-core';
import { match } from 'ts-pattern';
import Emittery from 'emittery';
import { type DebuggerDatasetProvider } from './index.js';

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
  contextValues: Record<string, DataValue>;
};

export type DynamicGraphRun = (data: DynamicGraphRunOptions) => Promise<void>;

export function startDebuggerServer(
  options: {
    getClientsForProcessor?: (processor: GraphProcessor, allClients: WebSocket[]) => WebSocket[];
    getProcessorsForClient?: (client: WebSocket, allProcessors: GraphProcessor[]) => GraphProcessor[];
    datasetProvider?: DebuggerDatasetProvider;
    server?: WebSocketServer;
    port?: number;
    dynamicGraphRun?: DynamicGraphRun;
    allowGraphUpload?: boolean;
    throttlePartialOutputs?: number;
    host?: string;
  } = {},
): RivetDebuggerServer {
  const { port = 21888, throttlePartialOutputs = 100, host = 'localhost' } = options;

  const server = options.server ?? new WebSocketServer({ port, host });

  const emitter = new Emittery<DebuggerEvents>();

  const attachedProcessors: GraphProcessor[] = [];

  server.on('connection', (socket) => {
    if (options.datasetProvider) {
      options.datasetProvider.onrequest = (type, data) => {
        socket.send(
          JSON.stringify({
            message: type,
            data,
          }),
        );
      };
    }

    socket.on('message', async (data) => {
      try {
        const stringData = data.toString();

        if (stringData.startsWith('set-static-data:')) {
          const [, id, value] = stringData.split(':');

          if (currentDebuggerState.uploadedProject) {
            currentDebuggerState.uploadedProject.data ??= {};
            currentDebuggerState.uploadedProject.data![id as DataId] = value!;
          }
          return;
        }

        const message = JSON.parse(data.toString()) as { type: string; data: unknown };

        await match(message)
          .with({ type: 'run' }, async () => {
            const { graphId, inputs, runToNodeIds, contextValues } = message.data as {
              graphId: GraphId;
              inputs: GraphInputs;
              runToNodeIds?: NodeId[];
              contextValues: Record<string, DataValue>;
            };

            await options.dynamicGraphRun?.({ client: socket, graphId, inputs, runToNodeIds, contextValues });
          })
          .with({ type: 'set-dynamic-data' }, async () => {
            if (options.allowGraphUpload) {
              const { project, settings, datasets } = message.data as {
                project: Project;
                settings: Settings;
                datasets: string;
              };
              currentDebuggerState.uploadedProject = project;
              currentDebuggerState.settings = settings;
            }
          })
          .with({ type: 'datasets:response' }, async () => {
            options.datasetProvider?.handleResponse(message.type, message.data as any);
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

      const lastPartialOutputsTimePerNode: Record<NodeId, number> = {};
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
      processor.on('start', (data) => {
        this.broadcast(processor, 'start', data);
      });
      processor.on('done', (data) => {
        this.broadcast(processor, 'done', data);
      });
      processor.on('partialOutput', (data) => {
        // Throttle the partial outputs because they can get ridiculous on the serdes side
        if (
          lastPartialOutputsTimePerNode[data.node.id] == null ||
          (lastPartialOutputsTimePerNode[data.node.id] ?? 0) + throttlePartialOutputs < Date.now()
        ) {
          this.broadcast(processor, 'partialOutput', data);
          lastPartialOutputsTimePerNode[data.node.id] = Date.now();
        }
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
