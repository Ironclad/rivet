import {
  GraphProcessor,
  NodeId,
  StringArrayDataValue,
  DataValue,
  coerceTypeOptional,
  ExecutionRecorder,
  GraphOutputs,
} from '@ironclad/rivet-core';
import { produce } from 'immer';
import { useRef } from 'react';
import { toast } from 'react-toastify';
import { TauriNativeApi } from '../model/native/TauriNativeApi';
import { useStableCallback } from './useStableCallback';
import { useSaveCurrentGraph } from './useSaveCurrentGraph';
import { useCurrentExecution } from './useCurrentExecution';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { userInputModalQuestionsState, userInputModalSubmitState } from '../state/userInput';
import { projectState } from '../state/savedGraphs';
import { settingsState } from '../state/settings';
import { graphState } from '../state/graph';
import { lastRecordingState, loadedRecordingState } from '../state/execution';
import { fillMissingSettingsFromEnvironmentVariables } from '../utils/tauri';

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

  const tryRunGraph = useStableCallback(
    async (options: { inputs?: Record<string, DataValue>; contextValues?: Record<string, DataValue> } = {}) => {
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
        recorder.record(processor);
  
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
  };
}