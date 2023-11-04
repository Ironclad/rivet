import {
  type GraphOutputs,
  type NodeId,
  type ProcessEvents,
  type StringArrayDataValue,
  globalRivetNodeRegistry,
  serializeDatasets,
  type GraphId,
  type DataValue,
} from '@ironclad/rivet-core';
import { useCurrentExecution } from './useCurrentExecution';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { graphState } from '../state/graph';
import { settingsState } from '../state/settings';
import { setCurrentDebuggerMessageHandler, useRemoteDebugger } from './useRemoteDebugger';
import { fillMissingSettingsFromEnvironmentVariables } from '../utils/tauri';
import { projectContextState, projectDataState, projectState } from '../state/savedGraphs';
import { useStableCallback } from './useStableCallback';
import { toast } from 'react-toastify';
import { trivetState } from '../state/trivet';
import { runTrivet } from '@ironclad/trivet';
import { produce } from 'immer';
import { userInputModalQuestionsState, userInputModalSubmitState } from '../state/userInput';
import { pluginsState } from '../state/plugins';
import { entries } from '../../../core/src/utils/typeSafety';
import { selectedExecutorState } from '../state/execution';
import { datasetProvider } from '../utils/globals';

// TODO: This allows us to retrieve the GraphOutputs from the remote debugger.
// If the remote debugger events had a unique ID for each run, this would feel a lot less hacky.
// For now, it will be impossible to support parallel processing in remote debugger mode.
let graphExecutionPromise: {
  promise: Promise<GraphOutputs> | undefined;
  resolve: ((value: GraphOutputs) => void) | undefined;
  reject: ((reason?: any) => void) | undefined;
};

export function useRemoteExecutor() {
  const currentExecution = useCurrentExecution();
  const graph = useRecoilValue(graphState);
  const savedSettings = useRecoilValue(settingsState);
  const project = useRecoilValue(projectState);
  const projectData = useRecoilValue(projectDataState);
  const [{ testSuites }, setTrivetState] = useRecoilState(trivetState);
  const setUserInputModalSubmit = useSetRecoilState(userInputModalSubmitState);
  const setUserInputQuestions = useSetRecoilState(userInputModalQuestionsState);
  const selectedExecutor = useRecoilValue(selectedExecutorState);
  const projectContext = useRecoilValue(projectContextState(project.metadata.id));

  const remoteDebugger = useRemoteDebugger({
    onDisconnect: () => {
      currentExecution.onStop();

      // If we're using the node executor, disconnecting means reconnecting to the internal executor
      if (selectedExecutor === 'nodejs') {
        remoteDebugger.connect('ws://localhost:21889/internal');
      }
    },
  });

  setCurrentDebuggerMessageHandler((message, data) => {
    switch (message) {
      case 'nodeStart':
        currentExecution.onNodeStart(data as ProcessEvents['nodeStart']);
        break;
      case 'nodeFinish':
        currentExecution.onNodeFinish(data as ProcessEvents['nodeFinish']);
        break;
      case 'nodeError':
        currentExecution.onNodeError(data as ProcessEvents['nodeError']);
        break;
      case 'userInput':
        currentExecution.onUserInput(data as ProcessEvents['userInput']);
        break;
      case 'start':
        currentExecution.onStart(data as ProcessEvents['start']);
        break;
      case 'done':
        const doneData = data as ProcessEvents['done'];
        graphExecutionPromise?.resolve?.(doneData.results);
        currentExecution.onDone(data as ProcessEvents['done']);
        break;
      case 'abort':
        graphExecutionPromise?.reject?.(new Error('graph execution aborted'));
        currentExecution.onAbort(data as ProcessEvents['abort']);
        break;
      case 'graphAbort':
        currentExecution.onGraphAbort(data as ProcessEvents['graphAbort']);
        break;
      case 'partialOutput':
        currentExecution.onPartialOutput(data as ProcessEvents['partialOutput']);
        break;
      case 'graphStart':
        currentExecution.onGraphStart(data as ProcessEvents['graphStart']);
        break;
      case 'graphFinish':
        currentExecution.onGraphFinish(data as ProcessEvents['graphFinish']);
        break;
      case 'nodeOutputsCleared':
        currentExecution.onNodeOutputsCleared(data as ProcessEvents['nodeOutputsCleared']);
        break;
      case 'trace':
        console.log(`remote: ${data}`);
        break;
      case 'pause':
        currentExecution.onPause();
        break;
      case 'resume':
        currentExecution.onResume();
        break;
      case 'error':
        const errorData = data as ProcessEvents['error'];
        graphExecutionPromise?.reject?.(errorData.error);
        currentExecution.onError(data as ProcessEvents['error']);
        break;
      case 'nodeExcluded':
        currentExecution.onNodeExcluded(data as ProcessEvents['nodeExcluded']);
        break;
    }
  });

  const tryRunGraph = async (options: { to?: NodeId[]; graphId?: GraphId } = {}) => {
    if (
      !remoteDebugger.remoteDebuggerState.started ||
      remoteDebugger.remoteDebuggerState.socket?.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    setUserInputModalSubmit({
      submit: (nodeId: NodeId, answers: StringArrayDataValue) => {
        remoteDebugger.send('user-input', { nodeId, answers });

        // Remove from pending questions
        setUserInputQuestions((q) =>
          produce(q, (draft) => {
            delete draft[nodeId];
          }),
        );
      },
    });

    const graphToRun = options.graphId ?? graph.metadata!.id!;

    try {
      if (remoteDebugger.remoteDebuggerState.remoteUploadAllowed) {
        remoteDebugger.send('set-dynamic-data', {
          project: {
            ...project,
            graphs: {
              ...project.graphs,
              [graph.metadata!.id!]: graph,
            },
          },
          settings: await fillMissingSettingsFromEnvironmentVariables(
            savedSettings,
            globalRivetNodeRegistry.getPlugins(),
          ),
        });

        for (const [id, dataValue] of entries(projectData)) {
          remoteDebugger.sendRaw(`set-static-data:${id}:${dataValue}`);
        }
      }

      const contextValues = entries(projectContext).reduce(
        (acc, [id, value]) => ({
          ...acc,
          [id]: value.value,
        }),
        {} as Record<string, DataValue>,
      );

      remoteDebugger.send('run', { graphId: graphToRun, runToNodeIds: options.to, contextValues });
    } catch (e) {
      console.error(e);
    }
    return;
  };

  const tryRunTests = useStableCallback(
    async (options: { testSuiteIds?: string[]; testCaseIds?: string[]; iterationCount?: number } = {}) => {
      toast.info(
        (options.iterationCount ?? 1) > 1 ? `Running Tests (${options.iterationCount!} iterations)` : 'Running Tests',
      );
      console.log('trying to run tests');
      currentExecution.onTrivetStart();

      setTrivetState((s) => ({
        ...s,
        runningTests: true,
        recentTestResults: undefined,
      }));
      const testSuitesToRun = options.testSuiteIds
        ? testSuites
            .filter((t) => options.testSuiteIds!.includes(t.id))
            .map((t) => ({
              ...t,
              testCases: options.testCaseIds
                ? t.testCases.filter((tc) => options.testCaseIds?.includes(tc.id))
                : t.testCases,
            }))
        : testSuites;
      try {
        const result = await runTrivet({
          project,
          iterationCount: options.iterationCount,
          testSuites: testSuitesToRun,
          onUpdate: (results) => {
            setTrivetState((s) => ({
              ...s,
              recentTestResults: results,
            }));
          },
          runGraph: async (project, graphId, inputs) => {
            if (remoteDebugger.remoteDebuggerState.remoteUploadAllowed) {
              remoteDebugger.send('set-dynamic-data', {
                project: {
                  ...project,
                  graphs: {
                    ...project.graphs,
                    [graph.metadata!.id!]: graph,
                  },
                },
                settings: await fillMissingSettingsFromEnvironmentVariables(
                  savedSettings,
                  globalRivetNodeRegistry.getPlugins(),
                ),
              });
            }

            {
              let resolve: (value: GraphOutputs) => void;
              let reject: (err: string) => void;
              const promise = new Promise<GraphOutputs>((res, rej) => {
                resolve = res;
                reject = rej;
              });
              graphExecutionPromise = {
                promise,
                resolve: resolve!,
                reject: reject!,
              };
            }

            const contextValues = entries(projectContext).reduce(
              (acc, [id, value]) => ({
                ...acc,
                [id]: value.value,
              }),
              {} as Record<string, DataValue>,
            );

            remoteDebugger.send('run', { graphId, inputs, contextValues });

            const results = await graphExecutionPromise.promise!;
            return results;
          },
        });
        setTrivetState((s) => ({
          ...s,
          recentTestResults: result,
          runningTests: false,
        }));
        toast.info(
          `Ran tests: ${result.testSuiteResults.length} tests, ${
            result.testSuiteResults.filter((t) => t.passing).length
          } passing`,
        );
        console.log(result);
      } catch (e) {
        console.log(e);
        setTrivetState((s) => ({
          ...s,
          runningTests: false,
        }));
        toast.error('Error running tests');
      }
    },
  );

  function tryAbortGraph() {
    console.log('Aborting via remote debugger');
    remoteDebugger.send('abort', undefined);
  }

  function tryPauseGraph() {
    console.log('Pausing via remote debugger');
    remoteDebugger.send('pause', undefined);
  }

  function tryResumeGraph() {
    console.log('Resuming via remote debugger');
    remoteDebugger.send('resume', undefined);
  }

  return {
    remoteDebugger,
    tryRunGraph,
    tryAbortGraph,
    tryPauseGraph,
    tryResumeGraph,
    active: remoteDebugger.remoteDebuggerState.started,
    tryRunTests,
  };
}
