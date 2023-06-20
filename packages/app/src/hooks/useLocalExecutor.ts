import {
  GraphProcessor,
  NodeId,
  StringArrayDataValue,
  DataValue,
  coerceTypeOptional,
  Inputs,
} from '@ironclad/rivet-core';
import { produce } from 'immer';
import { abort } from 'process';
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

export function useLocalExecutor() {
  const project = useRecoilValue(projectState);
  const graph = useRecoilValue(graphState);
  const currentProcessor = useRef<GraphProcessor | null>(null);
  const saveGraph = useSaveCurrentGraph();
  const currentExecution = useCurrentExecution();
  const setUserInputModalSubmit = useSetRecoilState(userInputModalSubmitState);
  const setUserInputQuestions = useSetRecoilState(userInputModalQuestionsState);
  const settings = useRecoilValue(settingsState);

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
            [graph.metadata!.id!]: graphTest?.testInputs?.[activeInputPerturbation]
              ? updateGraphWithTestValues(graph, graphTest.testInputs[activeInputPerturbation]!)
              : graph,
          },
        };

        const processor = new GraphProcessor(tempProject, graph.metadata!.id!);

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
        processor.on('abort', abort);
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

        const results = await processor.processGraph(
          {
            settings,
            nativeApi: new TauriNativeApi(),
          },
          options.inputs,
          options.contextValues,
        );

        console.log(results);

        return results;
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
