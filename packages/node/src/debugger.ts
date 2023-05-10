import WebSocket, { WebSocketServer } from 'ws';
import { GraphProcessor } from '../../core/src';

export interface NodaiDebuggerServer {
  webSocketServer: WebSocketServer;

  broadcast(message: string, data: unknown): void;

  attach(processor: GraphProcessor): void;
}

export function startDebuggerServer(port: number = 21888): NodaiDebuggerServer {
  const server = new WebSocketServer({ port });

  return {
    webSocketServer: server,
    broadcast(message: string, data: unknown) {
      server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ message, data }));
        }
      });
    },
    attach(processor: GraphProcessor) {
      processor.on('nodeStart', ({ node, inputs }) => {
        this.broadcast('nodeStart', { node, inputs });
      });
      processor.on('nodeFinish', ({ node, outputs }) => {
        this.broadcast('nodeFinish', { node, outputs });
      });
      processor.on('nodeError', ({ node, error }) => {
        this.broadcast('nodeError', { node, error });
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
    },
  };
}
