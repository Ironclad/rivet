import { useRecoilValue } from 'recoil';
import { GraphBuilder } from './GraphBuilder';
import { MenuBar } from './MenuBar';
import { graphState } from '../state/graph';
import { GraphProcessor } from '../model/GraphProcessor';
import { calculateCachesFor } from '../model/NodeGraph';
import { FC } from 'react';
import produce from 'immer';

export const NodaiApp: FC = () => {
  const graph = useRecoilValue(graphState);

  const tryRunGraph = () => {
    const finalGraph = produce(graph, (draft) => {
      calculateCachesFor(draft);
    });

    const processor = new GraphProcessor(finalGraph);
    const results = processor.processGraph({
      onNodeStart: (node, inputs) => {
        console.log(`Starting node ${node.id}. Inputs: ${JSON.stringify(inputs)}`);
      },
      onNodeFinish: (node, outputs) => {
        console.log(`Finished node ${node.id}. Outputs: ${JSON.stringify(outputs)}`);
      },
      onNodeError: (node, error) => {
        console.log(`Error in node ${node.id}: ${error}`);
      },
    });

    console.log(results);
  };

  return (
    <div className="app">
      <MenuBar onRunGraph={tryRunGraph} />
      <GraphBuilder />
    </div>
  );
};
