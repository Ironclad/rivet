import { useLatest } from 'ahooks';
import { useRecoilState } from 'recoil';
import { remoteDebuggerState } from '../state/execution.js';
import { useRef, useState } from 'react';
import { set } from 'lodash-es';

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
  };
}
