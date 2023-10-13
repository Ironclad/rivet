import { useLatest } from 'ahooks';
import { useRecoilState, useRecoilValue } from 'recoil';
import { remoteDebuggerState, selectedExecutorState } from '../state/execution.js';
import { useRef, useState } from 'react';
import { set } from 'lodash-es';
import { match } from 'ts-pattern';
import { datasetProvider } from '../utils/globals';

let currentDebuggerMessageHandler: ((message: string, data: unknown) => void) | null = null;

export function setCurrentDebuggerMessageHandler(handler: (message: string, data: unknown) => void) {
  currentDebuggerMessageHandler = handler;
}

// Hacky but whatev, shared between all useRemoteDebugger hooks
let manuallyDisconnecting = false;

export function useRemoteDebugger(options: { onConnect?: () => void; onDisconnect?: () => void } = {}) {
  const [remoteDebugger, setRemoteDebuggerState] = useRecoilState(remoteDebuggerState);
  const onConnectLatest = useLatest(options.onConnect ?? (() => {}));
  const onDisconnectLatest = useLatest(options.onDisconnect ?? (() => {}));
  const [retryDelay, setRetryDelay] = useState(0);

  const connectRef = useRef<((url: string) => void) | undefined>();
  const reconnectingTimeout = useRef<ReturnType<typeof setTimeout> | undefined>();
  const selectedExecutor = useRecoilValue(selectedExecutorState);

  connectRef.current = (url: string) => {
    if (!url) {
      url = `ws://localhost:21888`;
    }
    const socket = new WebSocket(url);
    onConnectLatest.current?.();

    setRemoteDebuggerState((prevState) => ({
      ...prevState,
      socket,
      started: true,
      url,
      isInternalExecutor: url === 'ws://localhost:21889/internal',
    }));

    socket.onopen = () => {
      setRemoteDebuggerState((prevState) => ({
        ...prevState,
        reconnecting: false,
      }));
      setRetryDelay(0);
    };

    socket.onclose = () => {
      if (manuallyDisconnecting) {
        setRemoteDebuggerState((prevState) => ({
          ...prevState,
          started: false,
          reconnecting: false,
          remoteUploadAllowed: false,
        }));
      } else {
        setRemoteDebuggerState((prevState) => ({
          ...prevState,
          started: false,
          reconnecting: true,
        }));

        // Exponential backoff, max 2s
        setRetryDelay((delay) => Math.min(2000, (delay + 100) * 1.5));

        reconnectingTimeout.current = setTimeout(() => {
          connectRef.current?.(url);
        }, retryDelay);
      }
    };

    socket.onmessage = (event) => {
      const { message, data } = JSON.parse(event.data);

      if (message === 'graph-upload-allowed') {
        console.log('Graph uploading is allowed.');
        setRemoteDebuggerState((prevState) => ({
          ...prevState,
          remoteUploadAllowed: true,
        }));
      } else if (message.startsWith('datasets:')) {
        handleDatasetsMessage(message, data, socket);
      } else {
        currentDebuggerMessageHandler?.(message, data);
      }
    };
  };

  return {
    remoteDebuggerState: remoteDebugger,
    connect: (url: string) => {
      manuallyDisconnecting = false;
      setRetryDelay(0);
      connectRef.current?.(url);
    },
    disconnect: () => {
      setRemoteDebuggerState((prevState) => ({
        ...prevState,
        started: false,
        reconnecting: false,
      }));
      manuallyDisconnecting = true;

      if (reconnectingTimeout.current) {
        clearTimeout(reconnectingTimeout.current);
      }

      if (remoteDebugger.socket) {
        remoteDebugger.socket?.close?.();
        onDisconnectLatest.current?.();
      }
    },
    send(type: string, data: unknown) {
      if (remoteDebugger.socket?.readyState === WebSocket.OPEN) {
        remoteDebugger.socket.send(JSON.stringify({ type, data }));
      }
    },
    sendRaw(data: string) {
      if (remoteDebugger.socket?.readyState === WebSocket.OPEN) {
        remoteDebugger.socket.send(data);
      }
    },
  };
}

async function handleDatasetsMessage(type: string, data: any, socket: WebSocket) {
  const { requestId, payload } = data;
  await match(type)
    .with('datasets:get-metadata', async () => {
      const metadata = await datasetProvider.getDatasetMetadata(payload.id);
      socket.send(
        JSON.stringify({
          type: 'datasets:response',
          data: {
            requestId,
            payload: metadata,
          },
        }),
      );
    })
    .with('datasets:get-for-project', async () => {
      const metadata = await datasetProvider.getDatasetsForProject(payload.projectId);
      socket.send(
        JSON.stringify({
          type: 'datasets:response',
          data: {
            requestId,
            payload: metadata,
          },
        }),
      );
    })
    .with('datasets:get-data', async () => {
      const data = await datasetProvider.getDatasetData(payload.id);
      socket.send(
        JSON.stringify({
          type: 'datasets:response',
          data: {
            requestId,
            payload: data,
          },
        }),
      );
    })
    .with('datasets:put-data', async () => {
      await datasetProvider.putDatasetData(payload.id, payload.data);
      socket.send(
        JSON.stringify({
          type: 'datasets:response',
          data: {
            requestId,
            payload: undefined,
          },
        }),
      );
    })
    .with('datasets:put-row', async () => {
      await datasetProvider.putDatasetRow(payload.id, payload.row);
      socket.send(
        JSON.stringify({
          type: 'datasets:response',
          data: {
            requestId,
            payload: undefined,
          },
        }),
      );
    })
    .with('datasets:put-metadata', async () => {
      await datasetProvider.putDatasetMetadata(payload.metadata);
      socket.send(
        JSON.stringify({
          type: 'datasets:response',
          data: {
            requestId,
            payload: undefined,
          },
        }),
      );
    })
    .with('datasets:clear-data', async () => {
      await datasetProvider.clearDatasetData(payload.id);
      socket.send(
        JSON.stringify({
          type: 'datasets:response',
          data: {
            requestId,
            payload: undefined,
          },
        }),
      );
    })
    .with('datasets:delete', async () => {
      await datasetProvider.deleteDataset(payload.id);
      socket.send(
        JSON.stringify({
          type: 'datasets:response',
          data: {
            requestId,
            payload: undefined,
          },
        }),
      );
    })
    .with('datasets:knn', async () => {
      const nearest = await datasetProvider.knnDatasetRows(payload.datasetId, payload.k, payload.vector);
      socket.send(
        JSON.stringify({
          type: 'datasets:response',
          data: {
            requestId,
            payload: nearest,
          },
        }),
      );
    })
    .otherwise(() => {
      console.error(`Unknown datasets message type: ${type}`);
    });
}
