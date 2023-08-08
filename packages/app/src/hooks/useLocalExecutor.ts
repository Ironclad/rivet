import {
  GraphProcessor,
  NodeId,
  StringArrayDataValue,
  DataValue,
  coerceTypeOptional,
  ExecutionRecorder,
  GraphOutputs,
} from '@ironclad/rivet-core';
import { current, produce } from 'immer';
import { useRef } from 'react';
import { toast } from 'react-toastify';
import { TauriNativeApi } from '../model/native/TauriNativeApi';
import { useStableCallback } from './useStableCallback';
import { useSaveCurrentGraph } from './useSaveCurrentGraph';
import { useCurrentExecution } from './useCurrentExecution';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { userInputModalQuestionsState, userInputModalSubmitState } from '../state/userInput';
import { projectState } from '../state/savedGraphs';
import { settingsState } from '../state/settings';
import { graphState } from '../state/graph';
import { lastRecordingState, loadedRecordingState } from '../state/execution';
import { fillMissingSettingsFromEnvironmentVariables } from '../utils/tauri';
import { trivetState } from '../state/trivet';
import { runTrivet } from '@ironclad/trivet';

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

    processor.onUserEvent('toast', (data: DataValue | undefined) => {
      const stringData = coerceTypeOptional(data, 'string');
      toast(stringData ?? 'Toast called, but no message was provided');
    });

    currentProcessor.current = processor;
  }

  const tryRunGraph = useStableCallback(async () => {
    try {
      saveGraph();

      if (currentProcessor.current?.isRunning) {
        return;
      }

      const tempProject = {
        ...project,
        graphs: {
          ...project.graphs,
          [graph.metadata!.id!]: graph,
        },
      };

      const recorder = new ExecutionRecorder();
      const processor = new GraphProcessor(tempProject, graph.metadata!.id!);
      processor.recordingPlaybackChatLatency = savedSettings.recordingPlaybackLatency ?? 1000;

      recorder.record(processor);

      attachGraphEvents(processor);

      let results: GraphOutputs;

      if (loadedRecording) {
        results = await processor.replayRecording(loadedRecording.recorder);
      } else {
        results = await processor.processGraph({
          settings: await fillMissingSettingsFromEnvironmentVariables(savedSettings),
          nativeApi: new TauriNativeApi(),
        });
      }

      setLastRecordingState(recorder.serialize());

      console.log(results);
    } catch (e) {
      console.log(e);
    }
  });

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
        const settings = await fillMissingSettingsFromEnvironmentVariables(savedSettings);
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
            attachGraphEvents(processor);
            return processor.processGraph(
              {
                settings,
                nativeApi: new TauriNativeApi(),
              },
              inputs,
            );
          },
          braintrustApiKey: settings.braintrustApiKey,
          setBrainTrustSummary: (id, summary) => 
            setTrivetState((s) => {
              let brainTrustSummaries = s.brainTrustSummaries;
              if (summary === undefined) {
                const { [id]: _, ...rest } = s.brainTrustSummaries || {};
                brainTrustSummaries = rest;
              } else {
                brainTrustSummaries = { ...s.brainTrustSummaries, [id]: summary };
              }
              return ({
              ...s,
              brainTrustSummaries,
            });
          })
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
