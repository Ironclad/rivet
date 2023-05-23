import { useLatest } from 'ahooks';
import { atom, useRecoilState } from 'recoil';

export const remoteDebuggerState = atom({
  key: 'remoteDebuggerState',
  default: {
    socket: null as WebSocket | null,
    started: false,
    reconnecting: false,
    url: '',
  },
});

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

  const connect = (url: string) => {
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
    }));

    socket.onopen = () => {
      setRemoteDebuggerState((prevState) => ({
        ...prevState,
        reconnecting: false,
      }));
    };

    socket.onclose = () => {
      if (manuallyDisconnecting) {
        setRemoteDebuggerState((prevState) => ({
          ...prevState,
          started: false,
          reconnecting: false,
        }));
      } else {
        setRemoteDebuggerState((prevState) => ({
          ...prevState,
          started: false,
          reconnecting: true,
        }));

        setTimeout(() => {
          connect(url);
        }, 2000);
      }
    };

    socket.onmessage = (event) => {
      const { message, data } = JSON.parse(event.data);
      currentDebuggerMessageHandler?.(message, data);
    };
  };

  return {
    remoteDebuggerState: remoteDebugger,
    connect: (url: string) => {
      manuallyDisconnecting = false;
      connect(url);
    },
    disconnect: () => {
      setRemoteDebuggerState((prevState) => ({
        ...prevState,
        reconnecting: false,
      }));
      manuallyDisconnecting = true;

      if (remoteDebugger.socket) {
        remoteDebugger.socket.close();
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
