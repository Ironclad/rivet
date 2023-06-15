import { produce } from 'immer';
import { cloneDeep } from 'lodash-es';
import { useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import {
  NodeId,
  ProcessId,
  GraphProcessor,
  ProcessEvents,
  coerceTypeOptional,
  PortId,
  StringArrayDataValue,
  DataValue,
  NodeGraphTestInputData,
  NodeGraph,
  ChartNode,
  GraphInputNode,
  GraphOutputs,
} from '../../../core/src';
import { TauriNativeApi } from '../model/native/TauriNativeApi';
import {
  lastRunDataByNodeState,
  runningGraphsState,
  NodeRunData,
  graphRunningState,
  graphPausedState,
  selectedProcessPageNodesState,
} from '../state/dataFlow';
import { selectedExecutorState } from '../state/execution';
import { graphState } from '../state/graph';
import { projectState } from '../state/savedGraphs';
import { settingsState } from '../state/settings';
import { userInputModalQuestionsState, userInputModalSubmitState, ProcessQuestions } from '../state/userInput';
import { useExecutorSidecar } from './useExecutorSidecar';
import { useRemoteDebugger, setCurrentDebuggerMessageHandler } from './useRemoteDebugger';
import { useSaveCurrentGraph } from './useSaveCurrentGraph';
import { useStableCallback } from './useStableCallback';
import { graphTesterState } from '../state/graphTester';

export function useGraphExecutor() {
  const graph = useRecoilValue(graphState);
  const { graphTest } = useRecoilValue(graphTesterState);
  const setLastRunData = useSetRecoilState(lastRunDataByNodeState);
  const settings = useRecoilValue(settingsState);
  const saveGraph = useSaveCurrentGraph();
  const setRunningGraphsState = useSetRecoilState(runningGraphsState);

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
  const setUserInputQuestions = useSetRecoilState(userInputModalQuestionsState);

  const setUserInputModalSubmit = useSetRecoilState(userInputModalSubmitState);
  const setGraphRunning = useSetRecoilState(graphRunningState);
  const setGraphPaused = useSetRecoilState(graphPausedState);
  const currentProcessor = useRef<GraphProcessor | null>(null);
  const project = useRecoilValue(projectState);
  const setSelectedPage = useSetRecoilState(selectedProcessPageNodesState);
  const selectedExecutor = useRecoilValue(selectedExecutorState);
  useExecutorSidecar({ enabled: selectedExecutor === 'node' });

  const stopAll = () => {
    setGraphRunning(false);
    setGraphPaused(false);
    setUserInputQuestions({});
    setRunningGraphsState([]);
  };

  const remoteDebugger = useRemoteDebugger({
    onDisconnect: () => {
      stopAll();
    },
  });

  const setSelectedNodePageLatest = (nodeId: NodeId) => {
    setSelectedPage((prev) => ({ ...prev, [nodeId]: 'latest' }));
  };

  const nodeStart = ({ node, inputs, processId }: ProcessEvents['nodeStart']) => {
    setDataForNode(node.id, processId, {
      inputData: inputs,
      status: { type: 'running' },
    });

    setSelectedNodePageLatest(node.id);
  };

  const nodeFinish = ({ node, outputs, processId }: ProcessEvents['nodeFinish']) => {
    setDataForNode(node.id, processId, {
      outputData: outputs,
      status: { type: 'ok' },
    });

    setSelectedNodePageLatest(node.id);
  };

  const nodeError = ({ node, error, processId }: ProcessEvents['nodeError']) => {
    setDataForNode(node.id, processId, {
      status: { type: 'error', error: typeof error === 'string' ? error : error.toString() },
    });

    setSelectedNodePageLatest(node.id);
  };

  const userInput = ({ node, inputs, processId }: ProcessEvents['userInput']) => {
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

  const start = () => {
    setUserInputQuestions({});
    setGraphRunning(true);
    setLastRunData({});
  };

  let executionPromise: Promise<GraphOutputs> & { resolve: (value: GraphOutputs) => void; reject: (reason?: Error) => void };
  const resetExecutionPromise = () => {
    let res, rej;
    const p = new Promise((resolve, err) => {
      res = resolve;
      rej = err;
    }) as any;
    p.resolve = res;
    p.reject = rej;
    executionPromise = p;
  }

  const done = ({ results }: ProcessEvents['done']) => {
    executionPromise?.resolve(results);
    stopAll();
  };

  const abort = () => {
    executionPromise?.reject(new Error('Execution aborted'));
    stopAll();
  };

  const onError = (data: ProcessEvents['error']) => {
    executionPromise?.reject(typeof data.error === 'string' ? new Error(data.error) : data.error);
    stopAll();
  };

  const graphStart = ({ graph }: ProcessEvents['graphStart']) => {
    setRunningGraphsState((running) => [...running, graph.metadata!.id!]);
  };

  const graphFinish = ({ graph }: ProcessEvents['graphFinish']) => {
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
  };

  const partialOutput = ({ node, outputs, index, processId }: ProcessEvents['partialOutput']) => {
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

  const nodeOutputsCleared = ({ node, processId }: ProcessEvents['nodeOutputsCleared']) => {
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

  const pause = () => {
    setGraphPaused(true);
  };

  const resume = () => {
    setGraphPaused(false);
  };

  setCurrentDebuggerMessageHandler((message, data) => {
    switch (message) {
      case 'nodeStart':
        nodeStart(data as ProcessEvents['nodeStart']);
        break;
      case 'nodeFinish':
        nodeFinish(data as ProcessEvents['nodeFinish']);
        break;
      case 'nodeError':
        nodeError(data as ProcessEvents['nodeError']);
        break;
      case 'userInput':
        userInput(data as ProcessEvents['userInput']);
        break;
      case 'start':
        start();
        break;
      case 'done':
        done(data as ProcessEvents['done']);
        break;
      case 'abort':
        abort();
        break;
      case 'partialOutput':
        partialOutput(data as ProcessEvents['partialOutput']);
        break;
      case 'graphStart':
        graphStart(data as ProcessEvents['graphStart']);
        break;
      case 'graphFinish':
        graphFinish(data as ProcessEvents['graphFinish']);
        break;
      case 'nodeOutputsCleared':
        nodeOutputsCleared(data as ProcessEvents['nodeOutputsCleared']);
        break;
      case 'trace':
        console.log(`remote: ${data}`);
        break;
      case 'pause':
        pause();
        break;
      case 'resume':
        resume();
        break;
      case 'error':
        onError(data as ProcessEvents['error']);
        break;
    }
  });

  useEffect(() => {
    if (selectedExecutor === 'node') {
      remoteDebugger.connect('ws://localhost:21889');
    } else {
      remoteDebugger.disconnect();
    }

    return () => {
      remoteDebugger.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExecutor]);

  function isGraphInputNode(n: ChartNode): n is GraphInputNode {
    return n.type === 'graphInput';
  }

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
            }
          }
        }
        return n;
      }),
    }
  }

  const tryRunGraph = useStableCallback(async () => {
    if (
      remoteDebugger.remoteDebuggerState.started &&
      remoteDebugger.remoteDebuggerState.socket?.readyState === WebSocket.OPEN
    ) {
      try {
        if (remoteDebugger.remoteDebuggerState.remoteUploadAllowed) {
          remoteDebugger.send('set-dynamic-data', {
            project: {
              ...project,
              graphs: {
                ...project.graphs,
                [graph.metadata!.id!]: graphTest?.testInputs?.[0] ? updateGraphWithTestValues(graph, graphTest.testInputs[0]) : graph,
              },
            },
            settings,
          });
        }

        resetExecutionPromise();
        remoteDebugger.send('run', { graphId: graph.metadata!.id! });
        return await executionPromise;
      } catch (e) {
        console.error(e);
        return;
      }
    }

    try {
      saveGraph();

      if (currentProcessor.current?.isRunning) {
        return;
      }

      const tempProject = {
        ...project,
        graphs: {
          ...project.graphs,
          [graph.metadata!.id!]: graphTest?.testInputs?.[0] ? updateGraphWithTestValues(graph, graphTest.testInputs[0]) : graph,
        },
      };

      const processor = new GraphProcessor(tempProject, graph.metadata!.id!);

      processor.on('nodeStart', nodeStart);
      processor.on('nodeFinish', nodeFinish);
      processor.on('nodeError', nodeError);

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

      processor.on('userInput', userInput);
      processor.on('start', start);
      processor.on('done', done);
      processor.on('abort', abort);
      processor.on('partialOutput', partialOutput);
      processor.on('graphStart', graphStart);
      processor.on('graphFinish', graphFinish);
      processor.on('nodeOutputsCleared', nodeOutputsCleared);
      processor.on('trace', (log) => console.log(log));
      processor.on('pause', pause);
      processor.on('resume', resume);
      processor.on('error', onError);

      processor.onUserEvent('toast', (data: DataValue | undefined) => {
        const stringData = coerceTypeOptional(data, 'string');
        toast(stringData ?? 'Toast called, but no message was provided');
      });

      currentProcessor.current = processor;

      const results = await processor.processGraph({ settings, nativeApi: new TauriNativeApi() });

      console.log(results);

      return results;
    } catch (e) {
      console.log(e);
    }
  });

  const tryAbortGraph = useStableCallback(() => {
    if (
      remoteDebugger.remoteDebuggerState.started &&
      remoteDebugger.remoteDebuggerState.socket?.readyState === WebSocket.OPEN
    ) {
      console.log('Aborting via remote debugger');
      remoteDebugger.send('abort', undefined);
    } else {
      currentProcessor.current?.abort();
    }
  });

  const tryPauseGraph = useStableCallback(() => {
    if (
      remoteDebugger.remoteDebuggerState.started &&
      remoteDebugger.remoteDebuggerState.socket?.readyState === WebSocket.OPEN
    ) {
      console.log('Pausing via remote debugger');
      remoteDebugger.send('pause', undefined);
    } else {
      currentProcessor.current?.pause();
    }
  });

  const tryResumeGraph = useStableCallback(() => {
    if (
      remoteDebugger.remoteDebuggerState.started &&
      remoteDebugger.remoteDebuggerState.socket?.readyState === WebSocket.OPEN
    ) {
      console.log('Resuming via remote debugger');
      remoteDebugger.send('resume', undefined);
    } else {
      currentProcessor.current?.resume();
    }
  });

  return {
    tryRunGraph,
    tryAbortGraph,
    tryPauseGraph,
    tryResumeGraph,
  };
}
