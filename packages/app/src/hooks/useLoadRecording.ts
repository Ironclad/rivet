import { useSetRecoilState } from 'recoil';
import { loadedRecordingState } from '../state/execution.js';
import { ioProvider } from '../utils/globals.js';

export function useLoadRecording() {
  const setLoadedRecording = useSetRecoilState(loadedRecordingState);

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
