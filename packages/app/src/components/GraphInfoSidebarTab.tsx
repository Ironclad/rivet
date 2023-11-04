import { type FC } from 'react';
import { useRecoilState } from 'recoil';
import { graphState } from '../state/graph.js';
import { savedGraphsState } from '../state/savedGraphs.js';
import { InlineEditableTextfield } from '@atlaskit/inline-edit';
import { type NodeGraph } from '@ironclad/rivet-core';

export const GraphInfoSidebarTab: FC = () => {
  const [graph, setGraph] = useRecoilState(graphState);
  const [savedGraphs, setSavedGraphs] = useRecoilState(savedGraphsState);

  function setGraphAndSavedGraph(graph: NodeGraph) {
    setGraph(graph);
    setSavedGraphs(savedGraphs.map((g) => (g.metadata!.id === graph.metadata!.id ? graph : g)));
  }

  return (
    <div className="graph-info-section">
      <InlineEditableTextfield
        key={`graph-name-${graph.metadata?.id}`}
        label="Graph Name"
        placeholder="Graph Name"
        onConfirm={(newValue) => setGraphAndSavedGraph({ ...graph, metadata: { ...graph.metadata, name: newValue } })}
        defaultValue={graph.metadata?.name ?? 'Untitled Graph'}
        readViewFitContainerWidth
      />
      <InlineEditableTextfield
        key={`graph-description-${graph.metadata?.id}`}
        label="Description"
        placeholder="Graph Description"
        defaultValue={graph.metadata?.description ?? ''}
        onConfirm={(newValue) =>
          setGraphAndSavedGraph({ ...graph, metadata: { ...graph.metadata, description: newValue } })
        }
        readViewFitContainerWidth
      />
    </div>
  );
};
