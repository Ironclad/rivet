import { useEffect } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { selectedExecutorState } from '../state/execution';
import { useExecutorSidecar } from './useExecutorSidecar';
import { useLocalExecutor } from './useLocalExecutor';
import { useRemoteExecutor } from './useRemoteExecutor';
import { useStableCallback } from './useStableCallback';
import { toast } from 'react-toastify';
import { trivetState } from '../state/trivet';
import { projectState } from '../state/savedGraphs';
import { graphState } from '../state/graph';
import { runTrivet } from '@ironclad/trivet';
import { settingsState } from '../state/settings';

export function useGraphExecutor() {
  const selectedExecutor = useRecoilValue(selectedExecutorState);
  const localExecutor = useLocalExecutor();
  const remoteExecutor = useRemoteExecutor();

  const project = useRecoilValue(projectState);
  const graph = useRecoilValue(graphState);
  const settings = useRecoilValue(settingsState);
  const [{ testSuites }, setTrivetState] = useRecoilState(trivetState);;

  useExecutorSidecar({ enabled: selectedExecutor === 'node' });

  const executor = remoteExecutor.active ? remoteExecutor : localExecutor;

  useEffect(() => {
    if (selectedExecutor === 'node') {
      remoteExecutor.remoteDebugger.connect('ws://localhost:21889');
    } else {
      remoteExecutor.remoteDebugger.disconnect();
    }

    return () => {
      remoteExecutor.remoteDebugger.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExecutor]);

  const tryRunTests = useStableCallback(async () => {
    toast.info('Running Tests');
    console.log('trying to run tests');
    setTrivetState((s) => ({
      ...s,
      runningTests: true,
      recentTestResults: undefined,
    }));
    try {
      const tempProject = {
        ...project,
        graphs: {
          ...project.graphs,
          [graph.metadata!.id!]: graph,
        },
      };

      console.log('starting trivet');
      const result = await runTrivet({
        project: tempProject,
        openAiKey: settings.openAiKey,
        testSuites: testSuites ?? [],
        onUpdate: (results) => {
          setTrivetState((s) => ({
            ...s,
            recentTestResults: results,
          }));
        },
      });
      setTrivetState((s) => ({
        ...s,
        recentTestResults: result,
        runningTests: false,
      }));
      toast.info(`Ran tests: ${result.testSuiteResults.length} tests, ${result.testSuiteResults.filter((t) => t.passing).length} passing`);
      console.log(result);
    } catch (e) {
      console.log(e);
      setTrivetState((s) => ({
        ...s,
        runningTests: false,
      }));
    }
  });

  return {
    tryRunGraph: executor.tryRunGraph,
    tryAbortGraph: executor.tryAbortGraph,
    tryPauseGraph: executor.tryPauseGraph,
    tryResumeGraph: executor.tryResumeGraph,
    tryRunTests,
  };
}
