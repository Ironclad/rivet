import { useRecoilValue, useSetRecoilState } from 'recoil';
import { GraphBuilder } from './GraphBuilder';
import { MenuBar } from './MenuBar';
import { graphState } from '../state/graph';
import { FC, useRef } from 'react';
import produce from 'immer';
import { NodeRunData, graphRunningState, lastRunDataByNodeState, runningGraphsState } from '../state/dataFlow';
import { css } from '@emotion/react';
import { SettingsModal } from './SettingsModal';
import { setGlobalTheme } from '@atlaskit/tokens';
import { settingsState } from '../state/settings';
import { userInputModalQuestionsState, userInputModalSubmitState } from '../state/userInput';
import { cloneDeep } from 'lodash-es';
import { LeftSidebar } from './LeftSidebar';
import { projectState } from '../state/savedGraphs';
import { useSaveCurrentGraph } from '../hooks/useSaveCurrentGraph';
import {
  DataValue,
  GraphProcessor,
  NodeId,
  PortId,
  ProcessEvents,
  StringArrayDataValue,
  coerceTypeOptional,
  expectType,
} from '@ironclad/nodai-core';
import { TauriNativeApi } from '../model/native/TauriNativeApi';
import { setCurrentDebuggerMessageHandler } from '../hooks/useRemoteDebugger';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useStableCallback } from '../hooks/useStableCallback';
import { useRemoteDebugger } from '../hooks/useRemoteDebugger';

const styles = css`
  overflow: hidden;
`;

setGlobalTheme({
  colorMode: 'dark',
});

export const NodaiApp: FC = () => {
  const graph = useRecoilValue(graphState);
  const setLastRunData = useSetRecoilState(lastRunDataByNodeState);
  const settings = useRecoilValue(settingsState);
  const saveGraph = useSaveCurrentGraph();
  const setRunningGraphsState = useSetRecoilState(runningGraphsState);
  const remoteDebugger = useRemoteDebugger();

  const setDataForNode = (nodeId: NodeId, data: Partial<NodeRunData>) => {
    setLastRunData((prev) =>
      produce(prev, (draft) => {
        draft[nodeId] = {
          ...draft[nodeId],
          ...cloneDeep(data),
        };
      }),
    );
  };
  const setUserInputQuestions = useSetRecoilState(userInputModalQuestionsState);

  const setUserInputModalSubmit = useSetRecoilState(userInputModalSubmitState);
  const setGraphRunning = useSetRecoilState(graphRunningState);
  const currentProcessor = useRef<GraphProcessor | null>(null);
  const project = useRecoilValue(projectState);

  const nodeStart = ({ node, inputs }: ProcessEvents['nodeStart']) => {
    setDataForNode(node.id, {
      inputData: inputs,
      status: { type: 'running' },
    });
  };

  const nodeFinish = ({ node, outputs }: ProcessEvents['nodeFinish']) => {
    setDataForNode(node.id, {
      outputData: outputs,
      status: { type: 'ok' },
    });
  };

  const nodeError = ({ node, error }: ProcessEvents['nodeError']) => {
    setDataForNode(node.id, {
      status: { type: 'error', error: typeof error === 'string' ? error : error.toString() },
    });
  };

  const userInput = ({ node, inputs }: ProcessEvents['userInput']) => {
    const questions = node.data.useInput
      ? expectType(inputs?.['questions' as PortId], 'string[]') ?? []
      : [node.data.prompt];

    setUserInputQuestions((q) => ({ ...q, [node.id]: questions }));
  };

  const start = () => {
    setGraphRunning(true);
  };

  const done = () => {
    setGraphRunning(false);
    setRunningGraphsState([]);
  };

  const abort = () => {
    setGraphRunning(false);
  };

  const graphStart = ({ graph }: ProcessEvents['graphStart']) => {
    setLastRunData((data) => {
      return produce(data, (draft) => {
        for (const node of graph.nodes) {
          delete draft[node.id];
        }
      });
    });
    if (graph.metadata?.id) {
      setRunningGraphsState((running) => [...running, graph.metadata!.id!]);
    }
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

  const partialOutput = ({ node, outputs, index }: ProcessEvents['partialOutput']) => {
    if (node.isSplitRun) {
      setLastRunData((prev) =>
        produce(prev, (draft) => {
          draft[node.id] = {
            ...draft[node.id],
            splitOutputData: {
              ...draft[node.id]?.splitOutputData,
              [index]: cloneDeep(outputs),
            },
          };
        }),
      );
    } else {
      setDataForNode(node.id, {
        outputData: outputs,
      });
    }
  };

  const nodeOutputsCleared = ({ node }: ProcessEvents['nodeOutputsCleared']) => {
    setLastRunData((prev) =>
      produce(prev, (draft) => {
        delete draft[node.id];
      }),
    );
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
        done();
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
    }
  });

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

      processor.onUserEvent('toast', (data: DataValue | undefined) => {
        const stringData = coerceTypeOptional(data, 'string');
        toast(stringData ?? 'Toast called, but no message was provided');
      });

      currentProcessor.current = processor;

      const results = await processor.processGraph({ settings, nativeApi: new TauriNativeApi() });

      console.log(results);
    } catch (e) {
      setGraphRunning(false);
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

  return (
    <div className="app" css={styles}>
      <MenuBar onRunGraph={tryRunGraph} onAbortGraph={tryAbortGraph} />
      <LeftSidebar />
      <GraphBuilder />
      <SettingsModal />
      <ToastContainer position="bottom-right" hideProgressBar newestOnTop />
    </div>
  );
};
