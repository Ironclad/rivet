import { type FC } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { graphState } from '../state/graph.js';
import { savedGraphsState } from '../state/savedGraphs.js';
import { InlineEditableTextfield } from '@atlaskit/inline-edit';
import { type NodeGraph } from '@ironclad/rivet-core';
import { Label } from '@atlaskit/form';
import { GraphRevisions } from './GraphRevisionList';

export const GraphInfoSidebarTab: FC = () => {
  const [graph, setGraph] = useAtom(graphState);
  const setSavedGraphs = useSetAtom(savedGraphsState);

  function setGraphAndSavedGraph(graph: NodeGraph) {
    setGraph(graph);
    setSavedGraphs((prev) => prev.map((g) => (g.metadata!.id === graph.metadata!.id ? graph : g)));
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
      <Label htmlFor="">Revisions</Label>
      <GraphRevisions />
    </div>
  );
};
