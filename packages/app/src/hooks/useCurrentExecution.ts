import {
  GraphOutputs,
  NodeGraph,
  NodeGraphTestInputData,
  NodeId,
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
import { graphState } from '../state/graph';
import { graphTesterState } from '../state/graphTester';

export function useCurrentExecution() {
  const graph = useRecoilValue(graphState);
  const setLastRunData = useSetRecoilState(lastRunDataByNodeState);
  const setSelectedPage = useSetRecoilState(selectedProcessPageNodesState);
  const setUserInputQuestions = useSetRecoilState(userInputModalQuestionsState);
  const setGraphRunning = useSetRecoilState(graphRunningState);
  const setGraphPaused = useSetRecoilState(graphPausedState);
  const setRunningGraphsState = useSetRecoilState(runningGraphsState);
  const { graphTest, activeInputPerturbation } = useRecoilValue(graphTesterState);

  let executionPromise: Promise<GraphOutputs> & {
    resolve: (value: GraphOutputs) => void;
    reject: (reason?: Error) => void;
  };
  const resetExecutionPromise = () => {
    let res, rej;
    const p = new Promise((resolve, err) => {
      res = resolve;
      rej = err;
    }) as any;
    p.resolve = res;
    p.reject = rej;
    executionPromise = p;
  };

  // TODO Weird hack to set input graph node to the value needed for the test.
  // Potentially make this less hacky.
  function updateGraphWithTestValues(g: NodeGraph, t: NodeGraphTestInputData): NodeGraph {
    return {
      ...g,
      nodes: g.nodes.map((n) => {
        if (isGraphInputNode(n) && t.inputs[n.data.id]) {
          const value = t.inputs[n.data.id];
          return {
            ...n,
            data: {
              ...n.data,
              useDefaultValueInput: false,
              defaultValue: value?.value,
            },
          };
        }
        return n;
      }),
    };
  }

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
    setDataForNode(node.id, processId, {
      inputData: inputs,
      status: { type: 'running' },
    });

    setSelectedNodePageLatest(node.id);
  };

  const onNodeFinish = ({ node, outputs, processId }: ProcessEvents['nodeFinish']) => {
    setDataForNode(node.id, processId, {
      outputData: outputs,
      status: { type: 'ok' },
    });

    setSelectedNodePageLatest(node.id);
  };

  const onNodeError = ({ node, error, processId }: ProcessEvents['nodeError']) => {
    setDataForNode(node.id, processId, {
      status: { type: 'error', error: typeof error === 'string' ? error : error.toString() },
    });

    setSelectedNodePageLatest(node.id);
  };

  function onStart() {
    setUserInputQuestions({});
    setGraphRunning(true);
    setLastRunData({});
  }

  function onStop() {
    setGraphRunning(false);
    setGraphPaused(false);
    setUserInputQuestions({});
    setRunningGraphsState([]);
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

  function onDone({ results }: ProcessEvents['done']) {
    executionPromise?.resolve(results);

    onStop();
  }

  function onAbort(_data: ProcessEvents['abort']) {
    executionPromise?.reject(new Error('Execution aborted'));

    onStop();
  }

  function onError(data: ProcessEvents['error']) {
    executionPromise?.reject(typeof data.error === 'string' ? new Error(data.error) : data.error);

    onStop();
  }

  function onGraphStart(_data: ProcessEvents['graphStart']) {
    setRunningGraphsState((running) => [...running, graph.metadata!.id!]);
  }

  function onGraphFinish(_data: ProcessEvents['graphFinish']) {
    if (graph.metadata?.id) {
      setRunningGraphsState((running) => {
        // Can have same graph multiple times, so just remove first one
        const existing = [...running];
        const graphIndex = existing.indexOf(graph.metadata!.id!);
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
    onPartialOutput,
    onPause,
    onResume,
    onNodeOutputsCleared,
  };
}
