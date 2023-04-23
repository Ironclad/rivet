import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { GraphBuilder } from './GraphBuilder';
import { MenuBar } from './MenuBar';
import { graphState } from '../state/graph';
import { GraphProcessor, NodeResults } from '../model/GraphProcessor';
import { calculateCachesFor } from '../model/NodeGraph';
import { FC, useState } from 'react';
import produce from 'immer';
import { NodeRunData, lastRunDataByNodeState } from '../state/dataFlow';
import { NodeId, PortId } from '../model/NodeBase';
import { css } from '@emotion/react';
import { SettingsModal } from './SettingsModal';
import { setGlobalTheme } from '@atlaskit/tokens';
import { settingsState } from '../state/settings';
import { userInputModalOpenState, userInputModalQuestionsState } from '../state/userInput';
import { UserInputNode } from '../model/nodes/UserInputNode';
import { UserInputModal } from './UserInputModal';
import { DataValue, StringArrayDataValue, expectType } from '../model/DataValue';
import { zip } from 'lodash-es';
import { LeftSidebar } from './LeftSidebar';

const styles = css`
  overflow: hidden;
`;

setGlobalTheme({
  colorMode: 'dark',
});

export const NodaiApp: FC = () => {
  const graph = useRecoilValue(graphState);
  const [lastRunData, setLastRunData] = useRecoilState(lastRunDataByNodeState);
  const settings = useRecoilValue(settingsState);

  const setDataForNode = (nodeId: NodeId, data: Partial<NodeRunData>) => {
    setLastRunData((prev) =>
      produce(prev, (draft) => {
        draft[nodeId] = {
          ...prev[nodeId],
          ...data,
        };
      }),
    );
  };

  const [userInputModalOpen, setUserInputOpen] = useRecoilState(userInputModalOpenState);
  const [userInputQuestions, setUserInputQuestions] = useRecoilState(userInputModalQuestionsState);

  const [userInputModalSubmit, setUserInputModalSubmit] = useState<{
    submit: (answers: StringArrayDataValue[]) => void;
  }>({
    submit: () => {},
  });

  const handleUserInput = async (
    userInputNodes: UserInputNode[],
    inputs: Record<PortId, DataValue>[],
  ): Promise<StringArrayDataValue[]> => {
    return new Promise((resolve) => {
      const questions = zip(userInputNodes, inputs).map(([node, inputs]) => {
        if (node!.data.useInput) {
          return expectType(inputs?.['questions' as PortId], 'string[]') ?? [];
        } else {
          return [node!.data.prompt];
        }
      });

      setUserInputQuestions(questions);
      setUserInputOpen(true);

      const handleModalSubmit = (answers: StringArrayDataValue[]) => {
        setUserInputOpen(false);
        resolve(answers);
        console.dir({ answers });
      };
      setUserInputModalSubmit({ submit: handleModalSubmit });
    });
  };

  const tryRunGraph = async () => {
    try {
      setLastRunData({});

      const finalGraph = produce(graph, (draft) => {
        calculateCachesFor(draft);
      });

      const processor = new GraphProcessor(finalGraph);
      const results = await processor.processGraph(
        { settings },
        {
          onNodeStart: (node, inputs) => {
            setDataForNode(node.id, {
              inputData: inputs,
              status: { type: 'running' },
            });
          },
          onNodeFinish: (node, outputs) => {
            setDataForNode(node.id, {
              outputData: outputs,
              status: { type: 'ok' },
            });
          },
          onNodeError: (node, error) => {
            setDataForNode(node.id, {
              status: { type: 'error', error: error.message },
            });
          },
          onUserInput: handleUserInput,
        },
      );

      console.log(results);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div className="app" css={styles}>
      <MenuBar onRunGraph={tryRunGraph} />
      <LeftSidebar />
      <GraphBuilder />
      <SettingsModal />
      <UserInputModal
        onSubmit={userInputModalSubmit.submit}
        questionGroups={userInputQuestions}
        open={userInputModalOpen}
      />
    </div>
  );
};
