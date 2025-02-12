import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { type ExecutionRecorder } from '@ironclad/rivet-core';
import { defaultExecutorState } from './settings';
import { createHybridStorage } from './storage.js';

const { storage } = createHybridStorage('execution');

export const remoteUploadAllowedState = atom<boolean>(false);

export const selectedExecutorState = atom(
  (get) => get(defaultExecutorState),
  (get, set, value: 'browser' | 'nodejs') => set(defaultExecutorState, value),
);

export type RemoteDebuggerState = {
  socket: WebSocket | null;
  started: boolean;
  reconnecting: boolean;
  url: string;
  remoteUploadAllowed: boolean;
  isInternalExecutor: boolean;
};

export const remoteDebuggerState = atomWithStorage<RemoteDebuggerState>(
  'remoteDebuggerState',
  {
    socket: null,
    started: false,
    reconnecting: false,
    url: '',
    remoteUploadAllowed: false,
    isInternalExecutor: false,
  },
  storage,
);

export const loadedRecordingState = atom<{
  path: string;
  recorder: ExecutionRecorder;
} | null>(null);

export const lastRecordingState = atom<string | undefined>(undefined);
