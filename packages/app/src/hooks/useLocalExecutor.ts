import {
  GraphProcessor,
  type NodeId,
  type StringArrayDataValue,
  type DataValue,
  coerceTypeOptional,
  ExecutionRecorder,
  type GraphOutputs,
  globalRivetNodeRegistry,
  type GraphId,
} from '@ironclad/rivet-core';
import { produce } from 'immer';
import { useRef } from 'react';
import { toast } from 'react-toastify';
import { TauriNativeApi } from '../model/native/TauriNativeApi';
import { useStableCallback } from './useStableCallback';
import { useSaveCurrentGraph } from './useSaveCurrentGraph';
import { useCurrentExecution } from './useCurrentExecution';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { userInputModalQuestionsState, userInputModalSubmitState } from '../state/userInput';
import { projectContextState, projectDataState, projectState } from '../state/savedGraphs';
import { recordExecutionsState, settingsState } from '../state/settings';
import { graphState } from '../state/graph';
import { lastRecordingState, loadedRecordingState } from '../state/execution';
import { fillMissingSettingsFromEnvironmentVariables } from '../utils/tauri';
import { trivetState } from '../state/trivet';
import { runTrivet } from '@ironclad/trivet';
import { datasetProvider } from '../utils/globals';
import { entries } from '../../../core/src/utils/typeSafety';

export function useLocalExecutor() {
  const project = useRecoilValue(projectState);
  const graph = useRecoilValue(graphState);
  const currentProcessor = useRef<GraphProcessor | null>(null);
  const saveGraph = useSaveCurrentGraph();
  const currentExecution = useCurrentExecution();
  const setUserInputModalSubmit = useSetRecoilState(userInputModalSubmitState);
  const setUserInputQuestions = useSetRecoilState(userInputModalQuestionsState);
  const savedSettings = useRecoilValue(settingsState);
  const loadedRecording = useRecoilValue(loadedRecordingState);
  const setLastRecordingState = useSetRecoilState(lastRecordingState);
  const [{ testSuites }, setTrivetState] = useRecoilState(trivetState);
  const recordExecutions = useRecoilValue(recordExecutionsState);
  const projectData = useRecoilValue(projectDataState);
  const projectContext = useRecoilValue(projectContextState(project.metadata.id));

  function attachGraphEvents(processor: GraphProcessor) {
    processor.on('nodeStart', currentExecution.onNodeStart);
    processor.on('nodeFinish', currentExecution.onNodeFinish);
    processor.on('nodeError', currentExecution.onNodeError);

    setUserInputModalSubmit({
      submit: (nodeId: NodeId, answers: StringArrayDataValue) => {
        processor.userInput(nodeId, answers);

        // Remove from pending questions
        setUserInputQuestions((q) =>
          produce(q, (draft) => {
            delete draft[nodeId];
          }),
        );
      },
    });

    processor.on('userInput', currentExecution.onUserInput);
    processor.on('start', currentExecution.onStart);
    processor.on('done', currentExecution.onDone);
    processor.on('abort', currentExecution.onAbort);
    processor.on('graphAbort', currentExecution.onGraphAbort);
    processor.on('partialOutput', currentExecution.onPartialOutput);
    processor.on('graphStart', currentExecution.onGraphStart);
    processor.on('graphFinish', currentExecution.onGraphFinish);
    processor.on('nodeOutputsCleared', currentExecution.onNodeOutputsCleared);
    processor.on('trace', (log) => console.log(log));
    processor.on('pause', currentExecution.onPause);
    processor.on('resume', currentExecution.onResume);
    processor.on('error', currentExecution.onError);
    processor.on('nodeExcluded', currentExecution.onNodeExcluded);

    processor.onUserEvent('toast', (data: DataValue | undefined) => {
      const stringData = coerceTypeOptional(data, 'string');
      toast(stringData ?? 'Toast called, but no message was provided');
    });

    currentProcessor.current = processor;
  }

  const tryRunGraph = useStableCallback(
    async (
      options: {
        graphId?: GraphId;
        to?: NodeId[];
      } = {},
    ) => {
      try {
        saveGraph();

        const graphToRun = options.graphId ?? graph.metadata!.id!;

        if (currentProcessor.current?.isRunning) {
          return;
        }

        const tempProject = {
          ...project,
          // Include the just-saved version of the currently selected graph, because saveGraph won't update the `project` until next render
          graphs: {
            ...project.graphs,
            [graph.metadata!.id!]: graph,
          },
          data: projectData,
        };

        const recorder = new ExecutionRecorder();
        const processor = new GraphProcessor(tempProject, graphToRun);
        processor.executor = 'browser';
        processor.recordingPlaybackChatLatency = savedSettings.recordingPlaybackLatency ?? 1000;

        if (options.to) {
          processor.runToNodeIds = options.to;
        }

        if (recordExecutions) {
          recorder.record(processor);
        }

        attachGraphEvents(processor);

        let results: GraphOutputs;

        if (loadedRecording) {
          results = await processor.replayRecording(loadedRecording.recorder);
        } else {
          const contextValues = entries(projectContext).reduce(
            (acc, [key, value]) => ({
              ...acc,
              [key]: value.value,
            }),
            {} as Record<string, DataValue>,
          );

          results = await processor.processGraph(
            {
              settings: await fillMissingSettingsFromEnvironmentVariables(
                savedSettings,
                globalRivetNodeRegistry.getPlugins(),
              ),
              nativeApi: new TauriNativeApi(),
              datasetProvider,
            },
            {},
            contextValues,
          );
        }

        if (recordExecutions) {
          setLastRecordingState(recorder.serialize());
        }
      } catch (e) {
        console.log(e);
      }
    },
  );

  const tryRunTests = useStableCallback(
    async (options: { testSuiteIds?: string[]; testCaseIds?: string[]; iterationCount?: number } = {}) => {
      toast.info(
        (options.iterationCount ?? 1) > 1 ? `Running Tests (${options.iterationCount!} iterations)` : 'Running Tests',
      );
      console.log(`trying to run tests`);
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
            const processor = new GraphProcessor(project, graphId);
            processor.executor = 'browser';
            attachGraphEvents(processor);
            return processor.processGraph(
              {
                settings: await fillMissingSettingsFromEnvironmentVariables(
                  savedSettings,
                  globalRivetNodeRegistry.getPlugins(),
                ),
                nativeApi: new TauriNativeApi(),
                datasetProvider,
              },
              inputs,
            );
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
    currentProcessor.current?.abort();
  }

  function tryPauseGraph() {
    currentProcessor.current?.pause();
  }

  function tryResumeGraph() {
    currentProcessor.current?.resume();
  }

  return {
    tryRunGraph,
    tryAbortGraph,
    tryPauseGraph,
    tryResumeGraph,
    tryRunTests,
  };
}
