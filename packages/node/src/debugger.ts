import WebSocket, { WebSocketServer } from 'ws';
import { GraphProcessor, getError } from '@ironclad/nodai-core';
import { match } from 'ts-pattern';
import Emittery from 'emittery';

export interface NodaiDebuggerServer {
  on: Emittery<DebuggerEvents>['on'];
  off: Emittery<DebuggerEvents>['off'];

  webSocketServer: WebSocketServer;

  broadcast(message: string, data: unknown): void;

  attach(processor: GraphProcessor): void;
}

export interface DebuggerEvents {
  error: Error;
}

export function startDebuggerServer(port: number = 21888): NodaiDebuggerServer {
  const server = new WebSocketServer({ port });
  const emitter = new Emittery<DebuggerEvents>();

  let attachedProcessor: GraphProcessor | null = null;

  server.on('connection', (socket) => {
    socket.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString()) as { type: string; data: unknown };

        await match(message)
          .with({ type: 'abort' }, async () => {
            await attachedProcessor?.abort();
          })
          .otherwise(async () => {
            throw new Error(`Unknown message type: ${message.type}`);
          });
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
    broadcast(message: string, data: unknown) {
      server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ message, data }));
        }
      });
    },
    attach(processor: GraphProcessor) {
      attachedProcessor = processor;

      processor.on('nodeStart', ({ node, inputs }) => {
        this.broadcast('nodeStart', { node, inputs });
      });
      processor.on('nodeFinish', ({ node, outputs }) => {
        this.broadcast('nodeFinish', { node, outputs });
      });
      processor.on('nodeError', ({ node, error }) => {
        this.broadcast('nodeError', { node, error: typeof error === 'string' ? error : error.toString() });
      });
      processor.on('nodeExcluded', (node) => {
        this.broadcast('nodeExcluded', node);
      });
      processor.on('start', () => {
        this.broadcast('start', null);
      });
      processor.on('done', ({ results }) => {
        this.broadcast('done', results);
      });
      processor.on('partialOutput', ({ node, index, outputs }) => {
        this.broadcast('partialOutput', { node, index, outputs });
      });
      processor.on('abort', () => {
        this.broadcast('abort', null);
      });
      processor.on('trace', (message) => {
        this.broadcast('trace', message);
      });
      processor.on('nodeOutputsCleared', ({ node }) => {
        this.broadcast('nodeOutputsCleared', { node });
      });
      processor.on('graphStart', ({ graph }) => {
        this.broadcast('graphStart', { graph });
      });
      processor.on('graphFinish', ({ graph }) => {
        this.broadcast('graphFinish', { graph });
      });
    },
  };
}
