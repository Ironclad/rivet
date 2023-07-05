import { useSetRecoilState } from 'recoil';
import { loadedRecordingState } from '../state/execution';
import { ioProvider } from '../utils/globals';

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
