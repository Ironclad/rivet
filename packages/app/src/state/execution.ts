import { atom } from 'recoil';
import { persistAtom } from './persist';

export const remoteUploadAllowedState = atom<boolean>({
  key: 'remoteUploadAllowed',
  default: false,
});

export const selectedExecutorState = atom<'browser' | 'node'>({
  key: 'selectedExecutor',
  default: 'browser',
});

export type RemoteDebuggerState = {
  socket: WebSocket | null;
  started: boolean;
  reconnecting: boolean;
  url: string;
  remoteUploadAllowed: boolean;
  isInternalExecutor: boolean;
};

export const remoteDebuggerState = atom<RemoteDebuggerState>({
  key: 'remoteDebuggerState',
  default: {
    socket: null,
    started: false,
    reconnecting: false,
    url: '',
    remoteUploadAllowed: false,
    isInternalExecutor: false,
  },
  effects_UNSTABLE: [persistAtom],
});
