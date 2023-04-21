import { useRecoilState, useRecoilValue } from 'recoil';
import { GraphBuilder } from './GraphBuilder';
import { MenuBar } from './MenuBar';
import { graphState } from '../state/graph';
import { GraphProcessor } from '../model/GraphProcessor';
import { calculateCachesFor } from '../model/NodeGraph';
import { FC } from 'react';
import produce from 'immer';
import { NodeRunData, lastRunDataByNodeState } from '../state/dataFlow';
import { NodeId } from '../model/NodeBase';
import { css } from '@emotion/react';

const styles = css`
  overflow: hidden;
`;

export const NodaiApp: FC = () => {
  const graph = useRecoilValue(graphState);
  const [lastRunData, setLastRunData] = useRecoilState(lastRunDataByNodeState);

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

  const tryRunGraph = async () => {
    try {
      setLastRunData({});

      const finalGraph = produce(graph, (draft) => {
        calculateCachesFor(draft);
      });

      const processor = new GraphProcessor(finalGraph);
      const results = await processor.processGraph({
        onNodeStart: (node, inputs) => {
          setDataForNode(node.id, {
            inputData: inputs,
          });
        },
        onNodeFinish: (node, outputs) => {
          setDataForNode(node.id, {
            outputData: outputs,
            status: { status: 'ok' },
          });
        },
        onNodeError: (node, error) => {
          setDataForNode(node.id, {
            status: { status: 'error', error: error.message },
          });
        },
      });

      console.log(results);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div className="app" css={styles}>
      <MenuBar onRunGraph={tryRunGraph} />
      <GraphBuilder />
    </div>
  );
};
