import { useRecoilValue } from 'recoil';
import { lastRecordingState } from '../state/execution';
import { ioProvider } from '../utils/globals';
import { useCallback } from 'react';

export function useSaveRecording() {
  const recording = useRecoilValue(lastRecordingState);

  return useCallback(async () => {
    if (!recording) {
      return;
    }

    try {
      await ioProvider.saveString(recording, 'recording.rivet-recording');
    } catch (err) {
      console.error(err);
    }
  }, [recording]);
}
