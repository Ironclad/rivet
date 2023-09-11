import {
  DataValue,
  Inputs,
  NodeId,
  Outputs,
  PortId,
  ProcessEvents,
  ProcessId,
  coerceTypeOptional,
} from '@ironclad/rivet-core';
import { produce } from 'immer';
import { cloneDeep } from 'lodash-es';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import {
  NodeRunData,
  graphPausedState,
  graphRunningState,
  lastRunDataByNodeState,
  runningGraphsState,
  selectedProcessPageNodesState,
} from '../state/dataFlow';
import { ProcessQuestions, userInputModalQuestionsState } from '../state/userInput';
import { lastRecordingState } from '../state/execution';
import { trivetTestsRunningState } from '../state/trivet';
import { useLatest } from 'ahooks';
import { entries, keys } from '../../../core/src/utils/typeSafety';
import { match } from 'ts-pattern';

function sanitizeDataValueForLength(value: DataValue | undefined) {
  return match(value)
    .with({ type: 'string' }, (value): DataValue => {
      if (value.value.length > 300_000) {
        return { type: 'string', value: `String (length ${value.value.length.toLocaleString()}` };
      }

      return value;
    })
    .with({ type: 'object' }, (value): DataValue => {
      const stringified = JSON.stringify(value.value);

      if (stringified.length > 300_000) {
        return { type: 'string', value: `Object (length ${stringified.length.toLocaleString()}` };
      }

      return value;
    })
    .with({ type: 'any' }, (value): DataValue => {
      const inferred = coerceTypeOptional(value, 'string');
      if ((inferred?.length ?? 0) > 300_000) {
        return { type: 'string', value: `Any (length ${inferred!.length.toLocaleString()}` };
      }

      return value;
    })
    .otherwise((value): DataValue | undefined => value);
}

export function useCurrentExecution() {
  const setLastRunData = useSetRecoilState(lastRunDataByNodeState);
  const setSelectedPage = useSetRecoilState(selectedProcessPageNodesState);
  const setUserInputQuestions = useSetRecoilState(userInputModalQuestionsState);
  const setGraphRunning = useSetRecoilState(graphRunningState);
  const setGraphPaused = useSetRecoilState(graphPausedState);
  const setRunningGraphsState = useSetRecoilState(runningGraphsState);
  const setLastRecordingState = useSetRecoilState(lastRecordingState);
  const trivetRunning = useRecoilValue(trivetTestsRunningState);
  const trivetRunningLatest = useLatest(trivetRunning);

  const setDataForNode = (nodeId: NodeId, processId: ProcessId, data: Partial<NodeRunData>) => {
    setLastRunData((prev) =>
      produce(prev, (draft) => {
        if (!draft[nodeId]) {
          draft[nodeId] = [];
        }
        const existingProcess = draft[nodeId]!.find((p) => p.processId === processId);
        if (existingProcess) {
          existingProcess.data = {
            ...existingProcess.data,
            ...cloneDeep(data),
          };
        } else {
          draft[nodeId]!.push({
            processId,
            data: cloneDeep(data),
          });
        }
      }),
    );
  };

  const setSelectedNodePageLatest = (nodeId: NodeId) => {
    setSelectedPage((prev) => ({ ...prev, [nodeId]: 'latest' }));
  };

  const onNodeStart = ({ node, inputs, processId }: ProcessEvents['nodeStart']) => {
    const sanitizedInputs: Inputs = {};
    for (const [key, value] of entries(inputs)) {
      sanitizedInputs[key] = sanitizeDataValueForLength(value) as DataValue;
    }

    setDataForNode(node.id, processId, {
      inputData: sanitizedInputs,
      status: { type: 'running' },
      startedAt: Date.now(),
    });
    setSelectedNodePageLatest(node.id);
  };

  const onNodeFinish = ({ node, outputs, processId }: ProcessEvents['nodeFinish']) => {
    const sanitizedOutputs: Outputs = {};
    for (const [key, value] of entries(outputs)) {
      sanitizedOutputs[key] = sanitizeDataValueForLength(value) as DataValue;
    }

    setDataForNode(node.id, processId, {
      outputData: sanitizedOutputs,
      status: { type: 'ok' },
      finishedAt: Date.now(),
    });
    setSelectedNodePageLatest(node.id);
  };

  const onNodeError = ({ node, error, processId }: ProcessEvents['nodeError']) => {
    setDataForNode(node.id, processId, {
      status: { type: 'error', error: typeof error === 'string' ? error : error.toString() },
      finishedAt: Date.now(),
    });

    setSelectedNodePageLatest(node.id);
  };

  function onStart() {
    setLastRecordingState(undefined);
    setUserInputQuestions({});
    setGraphRunning(true);

    // Don't clear the last run data if we're running trivet tests, so you can see both the
    // test graph and the validation graph in the results.
    if (!trivetRunningLatest.current) {
      setLastRunData({});
    }
  }

  function onTrivetStart() {
    setLastRecordingState(undefined);
    setUserInputQuestions({});
    setGraphRunning(true);
    setLastRunData({});
  }

  const stopAll = () => {
    setGraphRunning(false);
    setGraphPaused(false);
    setUserInputQuestions({});
    setRunningGraphsState([]);
  };

  const interruptAll = () => {
    // Mark all currently running nodes as interrupted
    setLastRunData((lastRun) =>
      produce(lastRun, (draft) => {
        keys(draft).forEach((nodeId) => {
          draft[nodeId]!.forEach((process) => {
            if (process.data.status?.type === 'running') {
              process.data.status = { type: 'interrupted' };
            }
          });
        });
      }),
    );
  };

  function onStop() {
    stopAll();
  }

  function onDone(_data: ProcessEvents['done']) {
    stopAll();
  }

  function onAbort(_data: ProcessEvents['abort']) {
    stopAll();
    interruptAll();
  }

  function onGraphAbort(_data: ProcessEvents['graphAbort']) {
    // nothing right now
  }

  function onError(data: ProcessEvents['error']) {
    stopAll();
    console.error(data.error);
  }

  const onUserInput = ({ node, inputs, processId }: ProcessEvents['userInput']) => {
    let questions: ProcessQuestions;

    if (node.data.useInput) {
      questions = {
        nodeId: node.id,
        processId,
        questions: coerceTypeOptional(inputs?.['questions' as PortId], 'string[]') ?? [],
      };
    } else {
      questions = {
        nodeId: node.id,
        processId,
        questions: [node.data.prompt],
      };
    }

    setUserInputQuestions((q) => {
      const prevQuestions = q[node.id] ?? [];
      // TODO weird not type checked here...
      return {
        ...q,
        [node.id]: [...prevQuestions, questions],
      };
    });

    setSelectedNodePageLatest(node.id);
  };

  function onGraphStart(data: ProcessEvents['graphStart']) {
    setRunningGraphsState((running) => [...running, data.graph.metadata!.id!]);
  }

  function onGraphFinish(data: ProcessEvents['graphFinish']) {
    if (data.graph.metadata?.id) {
      setRunningGraphsState((running) => {
        // Can have same graph multiple times, so just remove first one
        const existing = [...running];
        const graphIndex = existing.indexOf(data.graph.metadata!.id!);
        if (graphIndex !== -1) {
          existing.splice(graphIndex, 1);
        }
        return existing;
      });
    }
  }

  const onPartialOutput = ({ node, outputs, index, processId }: ProcessEvents['partialOutput']) => {
    if (node.isSplitRun) {
      setLastRunData((prev) =>
        produce(prev, (draft) => {
          if (!draft[node.id]) {
            draft[node.id] = [];
          }

          const existingProcess = draft[node.id]!.find((p) => p.processId === processId);
          if (existingProcess) {
            existingProcess.data.splitOutputData = {
              ...existingProcess.data.splitOutputData,
              [index]: cloneDeep(outputs),
            };
          } else {
            draft[node.id]!.push({
              processId,
              data: {
                splitOutputData: {
                  [index]: cloneDeep(outputs),
                },
              },
            });
          }
        }),
      );
    } else {
      setDataForNode(node.id, processId, {
        outputData: outputs,
      });
    }

    setSelectedNodePageLatest(node.id);
  };

  const onNodeOutputsCleared = ({ node, processId }: ProcessEvents['nodeOutputsCleared']) => {
    setLastRunData((prev) =>
      produce(prev, (draft) => {
        if (processId) {
          const index = draft[node.id]?.findIndex((p) => p.processId === processId);
          if (index !== undefined && index !== -1) {
            draft[node.id]!.splice(index, 1);
          }
        } else {
          delete draft[node.id];
        }
      }),
    );

    setSelectedNodePageLatest(node.id);
  };

  function onPause() {
    setGraphPaused(true);
  }

  function onResume() {
    setGraphPaused(false);
  }

  return {
    setDataForNode,
    onNodeStart,
    onNodeFinish,
    onNodeError,
    onStart,
    onStop,
    onUserInput,
    onDone,
    onAbort,
    onError,
    onGraphStart,
    onGraphFinish,
    onGraphAbort,
    onPartialOutput,
    onPause,
    onResume,
    onNodeOutputsCleared,
    onTrivetStart,
  };
}
