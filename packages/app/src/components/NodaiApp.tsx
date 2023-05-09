import { useRecoilValue, useSetRecoilState } from 'recoil';
import { GraphBuilder } from './GraphBuilder';
import { MenuBar } from './MenuBar';
import { graphState } from '../state/graph';
import { FC, useRef } from 'react';
import produce from 'immer';
import { NodeRunData, graphRunningState, lastRunDataByNodeState } from '../state/dataFlow';
import { css } from '@emotion/react';
import { SettingsModal } from './SettingsModal';
import { setGlobalTheme } from '@atlaskit/tokens';
import { settingsState } from '../state/settings';
import { userInputModalQuestionsState, userInputModalSubmitState } from '../state/userInput';
import { cloneDeep } from 'lodash-es';
import { LeftSidebar } from './LeftSidebar';
import { projectState } from '../state/savedGraphs';
import { useSaveCurrentGraph } from '../hooks/useSaveCurrentGraph';
import { GraphProcessor, NodeId, PortId, StringArrayDataValue, expectType } from '@ironclad/nodai-core';
import { TauriNativeApi } from '../model/native/TauriNativeApi';

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

  const tryRunGraph = async () => {
    try {
      saveGraph();

      if (currentProcessor.current?.isRunning) {
        return;
      }

      setLastRunData({});

      const tempProject = {
        ...project,
        graphs: {
          ...project.graphs,
          [graph.metadata!.id!]: graph,
        },
      };

      const processor = new GraphProcessor(tempProject, graph.metadata!.id!);

      processor.on('nodeStart', ({ node, inputs }) => {
        setDataForNode(node.id, {
          inputData: inputs,
          status: { type: 'running' },
        });
      });

      processor.on('nodeFinish', ({ node, outputs }) => {
        setDataForNode(node.id, {
          outputData: outputs,
          status: { type: 'ok' },
        });
      });

      processor.on('nodeError', ({ node, error }) => {
        setDataForNode(node.id, {
          status: { type: 'error', error: error.message },
        });
      });

      setUserInputModalSubmit({
        submit: (nodeId: NodeId, answers: StringArrayDataValue) => {
          processor.userInput(nodeId, answers);
        },
      });

      processor.on('userInput', ({ node, inputs }) => {
        const questions = node.data.useInput
          ? expectType(inputs?.['questions' as PortId], 'string[]') ?? []
          : [node.data.prompt];

        setUserInputQuestions((q) => ({ ...q, [node.id]: questions }));
      });

      processor.on('start', () => {
        setGraphRunning(true);
      });

      processor.on('done', () => {
        setGraphRunning(false);
      });

      processor.on('abort', () => {
        setGraphRunning(false);
      });

      processor.on('partialOutput', ({ node, outputs, index }) => {
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
      });

      currentProcessor.current = processor;

      const results = await processor.processGraph({ settings, nativeApi: new TauriNativeApi() });

      console.log(results);
    } catch (e) {
      setGraphRunning(false);
      console.log(e);
    }
  };

  const tryAbortGraph = () => {
    currentProcessor.current?.abort();
  };

  return (
    <div className="app" css={styles}>
      <MenuBar onRunGraph={tryRunGraph} onAbortGraph={tryAbortGraph} />
      <LeftSidebar />
      <GraphBuilder />
      <SettingsModal />
    </div>
  );
};
