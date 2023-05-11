import { atom, useRecoilState } from 'recoil';

export const remoteDebuggerState = atom({
  key: 'remoteDebuggerState',
  default: {
    socket: null as WebSocket | null,
    started: false,
    reconnecting: false,
    manualDisconnect: false,
    port: 0,
  },
});

let currentDebuggerMessageHandler: ((message: string, data: unknown) => void) | null = null;

export function setCurrentDebuggerMessageHandler(handler: (message: string, data: unknown) => void) {
  currentDebuggerMessageHandler = handler;
}

export function useRemoteDebugger() {
  const [remoteDebugger, setRemoteDebuggerState] = useRecoilState(remoteDebuggerState);

  const connect = (port: number = 21888) => {
    const socket = new WebSocket(`ws://localhost:${port}`);

    setRemoteDebuggerState((prevState) => ({
      ...prevState,
      socket,
      started: true,
      port,
      manualDisconnect: false,
    }));

    socket.onopen = () => {
      setRemoteDebuggerState((prevState) => ({
        ...prevState,
        reconnecting: false,
      }));
    };

    socket.onclose = () => {
      if (remoteDebugger.manualDisconnect) {
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
          connect(port);
        }, 2000);
      }
    };

    socket.onmessage = (event) => {
      const { message, data } = JSON.parse(event.data);
      currentDebuggerMessageHandler?.(message, data);
    };
  };

  return {
    remoteDebugger,
    connect,
    disconnect: () => {
      if (remoteDebugger.socket) {
        setRemoteDebuggerState((prevState) => ({
          ...prevState,
          manualDisconnect: true,
        }));
        remoteDebugger.socket.close();
      }
    },
  };
}
