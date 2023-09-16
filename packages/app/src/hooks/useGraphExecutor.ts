import { useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { selectedExecutorState } from '../state/execution';
import { useExecutorSidecar } from './useExecutorSidecar';
import { useLocalExecutor } from './useLocalExecutor';
import { useRemoteExecutor } from './useRemoteExecutor';

/**
 * Caution: only use this hook on components that will not dismount. The `useEffect` cleanup function
 * can result in a subtle bug where the remote debugger will mysteriously disconnect when the
 * component dismounts.
 * TODO Refactor so that this doesn't happen.
 * @returns
 */
export function useGraphExecutor() {
  const selectedExecutor = useRecoilValue(selectedExecutorState);
  const localExecutor = useLocalExecutor();
  const remoteExecutor = useRemoteExecutor();

  useExecutorSidecar({ enabled: selectedExecutor === 'nodejs' });

  const executor = remoteExecutor.active || selectedExecutor === 'nodejs' ? remoteExecutor : localExecutor;

  useEffect(() => {
    if (selectedExecutor === 'nodejs') {
      remoteExecutor.remoteDebugger.connect('ws://localhost:21889/internal');
    } else {
      remoteExecutor.remoteDebugger.disconnect();
    }

    return () => {
      remoteExecutor.remoteDebugger.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExecutor]);

  return {
    tryRunGraph: executor.tryRunGraph,
    tryAbortGraph: executor.tryAbortGraph,
    tryPauseGraph: executor.tryPauseGraph,
    tryResumeGraph: executor.tryResumeGraph,
    tryRunTests: executor.tryRunTests,
  };
}
