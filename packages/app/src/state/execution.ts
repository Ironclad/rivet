import { atom } from 'recoil';

export const remoteUploadAllowedState = atom<boolean>({
  key: 'remoteUploadAllowed',
  default: false,
});

export const selectedExecutorState = atom<'browser' | 'node'>({
  key: 'selectedExecutor',
  default: 'browser',
});

export const remoteDebuggerState = atom({
  key: 'remoteDebuggerState',
  default: {
    socket: null as WebSocket | null,
    started: false,
    reconnecting: false,
    url: '',
    remoteUploadAllowed: false,
    isInternalExecutor: false,
  },
});
