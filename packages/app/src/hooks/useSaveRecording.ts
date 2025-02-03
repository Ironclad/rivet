import { useAtomValue } from 'jotai';
import { lastRecordingState } from '../state/execution';
import { ioProvider } from '../utils/globals';
import { useCallback } from 'react';

export function useSaveRecording() {
  const recording = useAtomValue(lastRecordingState);

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
