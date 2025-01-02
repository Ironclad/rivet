import { useSetAtom } from 'jotai';
import { loadedRecordingState } from '../state/execution.js';
import { ioProvider } from '../utils/globals.js';

export function useLoadRecording() {
  const setLoadedRecording = useSetAtom(loadedRecordingState);

  return {
    loadRecording: () => {
      ioProvider.loadRecordingData(({ recorder, path }) => {
        setLoadedRecording({ recorder, path });
      });
    },
    unloadRecording: () => {
      setLoadedRecording(null);
    },
  };
}
