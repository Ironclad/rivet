import WebSocket, { WebSocketServer } from 'ws';
import { GraphId, GraphProcessor } from './core';
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
export declare function startDebuggerServer(options?: {
    getClientsForProcessor?: (processor: GraphProcessor, allClients: WebSocket[]) => WebSocket[];
    getProcessorsForClient?: (client: WebSocket, allProcessors: GraphProcessor[]) => GraphProcessor[];
    server?: WebSocketServer;
    port?: number;
    dynamicGraphRun?: (data: {
        client: WebSocket;
        graphId: GraphId;
    }) => Promise<void>;
}): RivetDebuggerServer;
