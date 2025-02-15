import {
  type DataValue,
  type Inputs,
  type NodeId,
  type Outputs,
  type PortId,
  type ProcessEvents,
  type ProcessId,
  coerceTypeOptional,
  getScalarTypeOf,
  isArrayDataValue,
  isScalarDataType,
  isScalarDataValue,
  arrayizeDataValue,
  type ChatMessageMessagePart,
} from '@ironclad/rivet-core';
import { produce } from 'immer';
import { cloneDeep, mapValues } from 'lodash-es';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  type NodeRunData,
  graphPausedState,
  graphRunningState,
  lastRunDataByNodeState,
  rootGraphState,
  runningGraphsState,
  selectedProcessPageNodesState,
  graphStartTimeState,
  type InputsOrOutputsWithRefs,
  type DataValueWithRefs,
  type NodeRunDataWithRefs,
} from '../state/dataFlow';
import { type ProcessQuestions, userInputModalQuestionsState } from '../state/userInput';
import { lastRecordingState } from '../state/execution';
import { trivetTestsRunningState } from '../state/trivet';
import { useLatest } from 'ahooks';
import { entries, keys } from '../../../core/src/utils/typeSafety';
import { P, match } from 'ts-pattern';
import { previousDataPerNodeToKeepState } from '../state/settings';
import { nanoid } from 'nanoid';
import { setGlobalDataRef } from '../utils/globals';

function sanitizeDataValueForLength(value: DataValue | undefined) {
  return match(value)
    .with({ type: 'string' }, (value): DataValue => {
      if (value.value == null) {
        return value;
      }

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
    .with({ type: 'image' }, (value): DataValue => {
      if (value.value.data instanceof Uint8Array || Array.isArray(value.value.data)) {
        return value;
      } else if (Array.isArray(value.value.data)) {
        return {
          ...value,
          value: {
            ...value.value,
            data: Uint8Array.from(value.value.data),
          },
        };
      } else {
        // JSON.stringify converts Uint8Array to an object with numeric keys, so convert it back.
        return {
          ...value,
          value: {
            ...value.value,
            data: Uint8Array.from(Object.values(value.value.data)),
          },
        };
      }
    })
    .with({ type: 'string[]' }, (value): DataValue => {
      const sumLength = value.value.reduce((acc, str) => acc + str.length, 0);
      if (sumLength > 300_000) {
        return {
          type: 'string',
          value: `string[] (${value.value.length.toLocaleString()} elements, total length ${sumLength.toLocaleString()}`,
        };
      }

      return value;
    })
    .otherwise((value): DataValue | undefined => value);
}

export function fixDataValueUint8Arrays(value: DataValue | undefined): DataValue | undefined {
  if (!value) {
    return undefined;
  }

  if (isArrayDataValue(value)) {
    const arrayized = arrayizeDataValue(value);

    const fixed = arrayized.map((val) => fixDataValueUint8Arrays(val));

    return {
      ...value,
      value: fixed.map((v) => v!.value),
    } as DataValue;
  }

  const fix = (value: Uint8Array | object) =>
    value instanceof Uint8Array ? value : Uint8Array.from(Object.values(value));

  const fixed = match(value)
    .with({ type: 'binary' }, (value): DataValue => {
      return {
        ...value,
        value: fix(value.value),
      };
    })
    .with({ type: 'audio' }, (value): DataValue => {
      return {
        ...value,
        value: {
          ...value.value,
          data: fix(value.value.data),
        },
      };
    })
    .with({ type: 'document' }, (value): DataValue => {
      return {
        ...value,
        value: {
          ...value.value,
          data: fix(value.value.data),
        },
      };
    })
    .with({ type: 'image' }, (value): DataValue => {
      return {
        ...value,
        value: {
          ...value.value,
          data: fix(value.value.data),
        },
      };
    })
    .with({ type: 'chat-message' }, (value): DataValue => {
      if (Array.isArray(value.value.message)) {
        return {
          ...value,
          value: {
            ...value.value,
            message: value.value.message.map((part) => fixChatMessagePartUint8Arrays(part)),
          },
        };
      }

      return {
        ...value,
        value: {
          ...value.value,
          message: fixChatMessagePartUint8Arrays(value.value.message),
        },
      };
    })
    .otherwise((value): DataValue => value);

  return fixed;
}

function fixChatMessagePartUint8Arrays(part: ChatMessageMessagePart): ChatMessageMessagePart {
  return match(part)
    .with(P.string, (part) => part)
    .with({ type: 'document' }, (part) => {
      return {
        ...part,
        data: Uint8Array.from(Object.values(part.data)),
      };
    })
    .otherwise((part) => part);
}

function cloneNodeDataForHistory(data: Partial<NodeRunData>): Partial<NodeRunDataWithRefs> {
  return {
    ...data,
    inputData: cloneNodeInputOrOutputDataForHistory(data.inputData),
    outputData: cloneNodeInputOrOutputDataForHistory(data.outputData),
    splitOutputData: data.splitOutputData
      ? (mapValues(data.splitOutputData, (val) => cloneNodeInputOrOutputDataForHistory(val)) as {
          [index: number]: InputsOrOutputsWithRefs;
        })
      : undefined,
  };
}

function cloneNodeInputOrOutputDataForHistory(data: Inputs | Outputs | undefined): InputsOrOutputsWithRefs | undefined {
  if (data == null) {
    return undefined;
  }

  return mapValues(data as Record<PortId, DataValue>, (val) => {
    if (!val) {
      return cloneDeep(val);
    }

    return convertToRef(val);
  }) as InputsOrOutputsWithRefs;
}

function convertToRef(value: DataValue): DataValueWithRefs {
  const scalarType = getScalarTypeOf(value.type);
  if (
    scalarType !== 'audio' &&
    scalarType !== 'binary' &&
    scalarType !== 'image' &&
    scalarType !== 'document' &&
    scalarType !== 'chat-message'
  ) {
    return cloneDeep(value) as DataValueWithRefs;
  }

  if (isScalarDataValue(value)) {
    const refId = nanoid();
    setGlobalDataRef(refId, value);
    return { type: value.type, value: { ref: refId } } as DataValueWithRefs;
  } else if (isArrayDataValue(value)) {
    const mappedValues = value.value.map((val) => {
      const asRef = convertToRef({ type: getScalarTypeOf(value.type), value: val } as DataValue);
      return asRef.value;
    });

    return { type: value.type, value: mappedValues } as DataValueWithRefs;
  } else {
    return cloneDeep(value) as DataValueWithRefs;
  }
}

export function useCurrentExecution() {
  const setLastRunData = useSetAtom(lastRunDataByNodeState);
  const setSelectedPage = useSetAtom(selectedProcessPageNodesState);
  const setUserInputQuestions = useSetAtom(userInputModalQuestionsState);
  const setGraphRunning = useSetAtom(graphRunningState);
  const setGraphPaused = useSetAtom(graphPausedState);
  const setRunningGraphsState = useSetAtom(runningGraphsState);
  const setLastRecordingState = useSetAtom(lastRecordingState);
  const trivetRunning = useAtomValue(trivetTestsRunningState);
  const trivetRunningLatest = useLatest(trivetRunning);
  const setRootGraph = useSetAtom(rootGraphState);
  const previousDataPerNodeToKeep = useAtomValue(previousDataPerNodeToKeepState);
  const setGraphStartTime = useSetAtom(graphStartTimeState);

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
            ...cloneNodeDataForHistory(data),
          };
        } else {
          if (previousDataPerNodeToKeep > -1) {
            const dataNotKept =
              previousDataPerNodeToKeep === 0 ? draft[nodeId]! : draft[nodeId]!.slice(0, -previousDataPerNodeToKeep);

            // Only keep the latest process data for each node for memory reasons
            for (const prev of dataNotKept) {
              if (prev.data.inputData) {
                prev.data.inputData = {};
              }
              if (prev.data.outputData) {
                prev.data.outputData = {};
              }
              if (prev.data.splitOutputData) {
                prev.data.splitOutputData = {};
              }
            }
          }

          draft[nodeId]!.push({
            processId,
            data: cloneNodeDataForHistory(data)!,
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
      const uint8ArrayFixed = fixDataValueUint8Arrays(value) as DataValue;
      sanitizedInputs[key] = sanitizeDataValueForLength(uint8ArrayFixed) as DataValue;
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
      const uint8ArrayFixed = fixDataValueUint8Arrays(value) as DataValue;
      sanitizedOutputs[key] = sanitizeDataValueForLength(uint8ArrayFixed) as DataValue;
    }

    setDataForNode(node.id, processId, {
      outputData: sanitizedOutputs,
      status: { type: 'ok' },
      finishedAt: Date.now(),
    });
    setSelectedNodePageLatest(node.id);
  };

  function onNodeExcluded({ node, processId, inputs, outputs, reason }: ProcessEvents['nodeExcluded']) {
    setDataForNode(node.id, processId, {
      inputData: inputs,
      outputData: outputs,
      status: { type: 'notRan', reason },
      startedAt: Date.now(),
      finishedAt: Date.now(),
    });
    setSelectedNodePageLatest(node.id);
  }

  const onNodeError = ({ node, error, processId }: ProcessEvents['nodeError']) => {
    setDataForNode(node.id, processId, {
      status: { type: 'error', error: typeof error === 'string' ? error : error.toString() },
      finishedAt: Date.now(),
    });

    setSelectedNodePageLatest(node.id);
  };

  function onStart({ startGraph }: ProcessEvents['start']) {
    setLastRecordingState(undefined);
    setUserInputQuestions({});
    setGraphRunning(true);
    setRootGraph(startGraph.metadata!.id);
    setGraphStartTime(Date.now());

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

  const onUserInput = ({ node, inputs, processId, inputStrings }: ProcessEvents['userInput']) => {
    const questions = {
      nodeId: node.id,
      processId,
      questions: inputStrings,
    };

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
              [index]: cloneNodeInputOrOutputDataForHistory(outputs)!,
            };
          } else {
            draft[node.id]!.push({
              processId,
              data: {
                splitOutputData: {
                  [index]: cloneNodeInputOrOutputDataForHistory(outputs)!,
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
    onNodeExcluded,
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
