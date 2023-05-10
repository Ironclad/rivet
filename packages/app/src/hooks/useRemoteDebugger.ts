import { atom, useRecoilState } from 'recoil';

export const remoteDebuggerState = atom({
  key: 'remoteDebuggerState',
  default: {
    socket: null as WebSocket | null,
    started: false,
    port: 0,
  },
});

let currentDebuggerMessageHandler: ((message: string, data: unknown) => void) | null = null;

export function setCurrentDebuggerMessageHandler(handler: (message: string, data: unknown) => void) {
  currentDebuggerMessageHandler = handler;
}

export function useRemoteDebugger() {
  const [remoteDebugger, setRemoteDebuggerState] = useRecoilState(remoteDebuggerState);

  return {
    remoteDebugger,
    connect: (port: number = 21888) => {
      const socket = new WebSocket(`ws://localhost:${port}`);

      setRemoteDebuggerState({
        socket,
        started: true,
        port,
      });

      socket.onclose = () => {
        setRemoteDebuggerState({
          socket,
          started: false,
          port: 0,
        });
      };

      socket.onmessage = (event) => {
        const { message, data } = JSON.parse(event.data);
        currentDebuggerMessageHandler?.(message, data);
      };
    },
    disconnect: () => {
      if (remoteDebugger.socket) {
        remoteDebugger.socket.close();
      }
    },
  };
}
