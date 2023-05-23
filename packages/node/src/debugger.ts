import WebSocket, { WebSocketServer } from 'ws';
import { GraphProcessor, getError } from './core';
import { match } from 'ts-pattern';
import Emittery from 'emittery';

export interface NodaiDebuggerServer {
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

export function startDebuggerServer(
  options: {
    getClientsForProcessor?: (processor: GraphProcessor, allClients: WebSocket[]) => WebSocket[];
    getProcessorsForClient?: (client: WebSocket, allProcessors: GraphProcessor[]) => GraphProcessor[];
    server?: WebSocketServer;
    port?: number;
  } = {},
): NodaiDebuggerServer {
  const { port = 21888 } = options;

  const server = options.server ?? new WebSocketServer({ port });

  const emitter = new Emittery<DebuggerEvents>();

  const attachedProcessors: GraphProcessor[] = [];

  server.on('connection', (socket) => {
    socket.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString()) as { type: string; data: unknown };

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
            .otherwise(async () => {
              throw new Error(`Unknown message type: ${message.type}`);
            });
        }
      } catch (err) {
        try {
          await emitter.emit('error', getError(err));
        } catch (err) {
          // noop, just prevent unhandled rejection
        }
      }
    });
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

      processor.on('nodeStart', ({ node, inputs }) => {
        this.broadcast(processor, 'nodeStart', { node, inputs });
      });
      processor.on('nodeFinish', ({ node, outputs }) => {
        this.broadcast(processor, 'nodeFinish', { node, outputs });
      });
      processor.on('nodeError', ({ node, error }) => {
        this.broadcast(processor, 'nodeError', { node, error: typeof error === 'string' ? error : error.toString() });
      });
      processor.on('nodeExcluded', (node) => {
        this.broadcast(processor, 'nodeExcluded', node);
      });
      processor.on('start', () => {
        this.broadcast(processor, 'start', null);
      });
      processor.on('done', ({ results }) => {
        this.broadcast(processor, 'done', results);
      });
      processor.on('partialOutput', ({ node, index, outputs }) => {
        this.broadcast(processor, 'partialOutput', { node, index, outputs });
      });
      processor.on('abort', () => {
        this.broadcast(processor, 'abort', null);
      });
      processor.on('trace', (message) => {
        this.broadcast(processor, 'trace', message);
      });
      processor.on('nodeOutputsCleared', ({ node }) => {
        this.broadcast(processor, 'nodeOutputsCleared', { node });
      });
      processor.on('graphStart', ({ graph }) => {
        this.broadcast(processor, 'graphStart', { graph });
      });
      processor.on('graphFinish', ({ graph }) => {
        this.broadcast(processor, 'graphFinish', { graph });
      });
      processor.on('pause', () => {
        this.broadcast(processor, 'pause', null);
      });
      processor.on('resume', () => {
        this.broadcast(processor, 'resume', null);
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
