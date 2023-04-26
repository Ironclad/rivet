import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { GraphBuilder } from './GraphBuilder';
import { MenuBar } from './MenuBar';
import { graphState } from '../state/graph';
import { GraphProcessor } from '../model/GraphProcessor';
import { calculateCachesFor } from '../model/NodeGraph';
import { FC, useState } from 'react';
import produce from 'immer';
import { NodeRunData, lastRunDataByNodeState } from '../state/dataFlow';
import { ChartNode, NodeId, PortId } from '../model/NodeBase';
import { css } from '@emotion/react';
import { SettingsModal } from './SettingsModal';
import { setGlobalTheme } from '@atlaskit/tokens';
import { settingsState } from '../state/settings';
import { userInputModalOpenState, userInputModalQuestionsState, userInputModalSubmitState } from '../state/userInput';
import { UserInputNode } from '../model/nodes/UserInputNode';
import { UserInputModal } from './UserInputModal';
import { DataValue, ArrayDataValue, StringDataValue, expectType } from '../model/DataValue';
import { cloneDeep, zip } from 'lodash-es';
import { LeftSidebar } from './LeftSidebar';
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

  const handleUserInput = async (
    needsInput: Record<NodeId, Record<PortId, DataValue>>,
    nodes: Record<NodeId, UserInputNode>,
  ): Promise<Record<NodeId, ArrayDataValue<StringDataValue>>> => {
    return new Promise((resolve) => {
      const questionsPerNode: Record<NodeId, string[]> = Object.fromEntries(
        Object.entries(needsInput).map(([nodeId, inputs]) => {
          const node = nodes[nodeId as NodeId]!;
          const questions = node.data.useInput
            ? expectType(inputs?.['questions' as PortId], 'string[]') ?? []
            : [node.data.prompt];
          return [nodeId, questions];
        }),
      );

      setUserInputQuestions(questionsPerNode);

      const handleModalSubmit = (nodeId: NodeId, answers: ArrayDataValue<StringDataValue>) => {
        console.dir({ nodeId, answers });
        const resolveData: Record<NodeId, ArrayDataValue<StringDataValue>> = {
          [nodeId]: answers,
        };
        resolve(resolveData);
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
        { settings, nativeApi: new TauriNativeApi() },
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
          onPartialOutputs: (node, outputs, index) => {
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
          },
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
    </div>
  );
};
