import { useSetRecoilState } from 'recoil';
import { loadedRecordingState } from '../state/execution';
import { loadRecordingData } from '../utils/fileIO';

export function useLoadRecording() {
  const setLoadedRecording = useSetRecoilState(loadedRecordingState);

  return {
    loadRecording: () => {
      loadRecordingData(({ recorder, path }) => {
        setLoadedRecording({ recorder, path });
      });
    },
    unloadRecording: () => {
      setLoadedRecording(null);
    },
  };
}
